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
}

// Regenerate random for a category
function regenerateRandom(category) {
    if (category === 'funFact') selectedFunFact = getRandomItem(funFacts, usedFunFacts);
    if (category === 'proTip') selectedProTip = getRandomItem(proTips, usedProTips);
    if (category === 'quote') selectedQuote = getRandomItem(motivationalQuotes, usedQuotes);

    localStorage.setItem('usedFunFacts', JSON.stringify(usedFunFacts));
    localStorage.setItem('usedProTips', JSON.stringify(usedProTips));
    localStorage.setItem('usedQuotes', JSON.stringify(usedQuotes));

    updatePreviews();
}

function openModal(category) {
    const modal = document.getElementById('content-modal');
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

    // Force visible with both classList (for Tailwind .hidden + .flex rules) and inline style
    // This fixes cases where the header looked like an "empty box" with no title
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
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
        randomLi.className = 'p-4 mb-2 bg-[#F15A29]/10 border border-[#F15A29]/30 rounded-2xl cursor-pointer hover:bg-[#F15A29]/20 transition-all text-[#F15A29] font-semibold flex items-center gap-3';
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

// Close modal
function closeModal() {
    const modal = document.getElementById('content-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.onclick = null;   // clean up event listener
    }
    // Clean up any search that was injected just for the newsletter custom choice lists
    // (keeps social pillar modals that reuse #content-modal free of stray search bars)
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

// Close modal (single definition)
function closeModal() {
    let modal = document.getElementById('content-modal');
    if (!modal) modal = document.getElementById('content-modal-legacy');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }
    const search = document.getElementById('modal-search');
    if (search) search.value = '';
}

// Close on Esc key (idempotent)
if (!window._nlEscListener) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  window._nlEscListener = true;
}

// === PERSISTENCE SETUP ===
const persistentFields = [
    'nl-audience', 'nl-tone', 'nl-location', 'nl-title', 'nl-length',
    'nl-name',                    // keep
    'nl-email',                   // keep
    'nl-blog-url', 'nl-blog-title',
    'nl-include-blog',
    'nl-personal-photo',
    'nl-personal-video'
];

// === GLOBAL EMAIL / CRM SETTINGS ===
const EMAIL_WIDTH = 600;
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
        alert('No previous newsletter to edit — generate one first!');
        return;
    }
    generateNewsletter(feedback);
});

async function generateNewsletter(feedback = '') {
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
    const fullName = document.getElementById('nl-name').value || 'Your Loan Officer';
    const firstName = fullName.split(' ')[0].trim();

    // === SAVE ORIGINAL LOADING CONTENT (after force so we capture the clean base card) ===
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        loadingEl.dataset.originalContent = loadingEl.innerHTML;
    }

    // === INJECT RICH PROGRESS CONTENT — styled to exactly match the Weekly/Social/Blog loading cards ===
    const loadingTipsContent = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl border border-gray-200 dark:border-gray-700">
                
                <div class="text-center mb-8">
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
        const sections = Array.from(document.querySelectorAll('#newsletter-generator input[type="checkbox"]:checked'))
                         .map(c => c.id.replace('nl-', ''))
                         .join(', ');

        const personalPhotoUrl = document.getElementById('nl-personal-photo')?.value.trim() || '';
        const personalVideoUrl = document.getElementById('nl-personal-video')?.value.trim() || '';



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
                lastGeneratedHTML,
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
                'User Inputs:',
                '- Audience: ' + (document.getElementById('nl-audience').value || 'Full Database'),
                '- Tone: ' + (document.getElementById('nl-tone').value || 'warm-professional') + ' — Write in this exact tone throughout the entire newsletter.',
                '- Match the full "LO PROFILE & VOICE CONTEXT" section above for this specific loan officer (use their personality, voice traits, hobbies, and challenges to make the personal note + any relatable language feel authentic to them — blend naturally, never salesy).',
                '- Location: ' + (document.getElementById('nl-location').value || 'Fort Wayne, Indiana'),
                '- Title: ' + (document.getElementById('nl-title').value || 'Mortgage Insights'),
                '- Length: ' + (document.getElementById('nl-length').value || 'medium'),
                '- Sections: ' + (sections || 'Market Update, Industry News, Local Spotlight, Quick Recipe'),
                '- Personal update: "' + (document.getElementById('nl-personal-text').value || 'Excited to help more families achieve homeownership this year!') + '"',
                '- Personal photo URL: "' + personalPhotoUrl + '"',
                '- Personal video URL: "' + personalVideoUrl + '"',
                '- Specific topics / special requests (including any language requests such as "in Spanish" or "prepare the newsletter in French"): "' + (document.getElementById('nl-specific').value || 'None') + '"',
                '',
                'Branding:',
                '- Name: ' + (document.getElementById('nl-name').value || 'Your Loan Officer'),
                '- Email: ' + (document.getElementById('nl-email').value || ''),
                '',
                '- REQUIRED HERO IMAGE: ' + selectedHero,
                '',
                'LO PROFILE & VOICE CONTEXT (use this to make the whole newsletter — especially tone, personal note, local flavor, and any storytelling — feel like it was written by *this specific* loan officer. Blend personality/voice/hobbies/challenges naturally where it fits; do not force it):',
                '- Name: ' + (p.name || document.getElementById('nl-name').value || ''),
                '- Email: ' + (p.email || document.getElementById('nl-email').value || ''),
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
                '- Sources hyperlinks in Market/Industry sections are NON-NEGOTIABLE — always include clickable links using the exact format and real URLs provided.',
                '- PERSONAL UPDATE: Rewrite/polish the raw input — warm, relatable, newsletter-perfect.',
                '- PERSONAL NOTE TITLE RULE: The personal note section MUST be titled exactly "A Note From [Name]" where [Name] is replaced with ONLY THE FIRST NAME from the Name field (e.g. if Name is "Adam Garman", use "Adam" only — NEVER use the last name or full name in the title). NEVER output "A Note From Adam" or any other hardcoded name unless it exactly matches the first name. Use only the first name.',
                '- PERSONAL MEDIA: If a video URL is provided, we will embed a clean responsive video player. Otherwise use the photo if provided. Leave the exact placeholder [PERSONAL PHOTO PLACEHOLDER] untouched so post-processing can handle photo or video correctly. Convert YouTube Shorts URLs automatically for better compatibility.',
                '- REFERRAL CTA: Leave the exact placeholder [REFERRAL CTA PLACEHOLDER] untouched. Do NOT add your own CTA or signature block here. We handle the final branded version in post-processing.',
                '- ALL EXTERNAL LINKS: target="_blank" rel="noopener".',
                '- If a personal photo URL is provided, place the image BELOW the personal note text. Use a simple table wrapper with max-width around 590px and max-height around 480px so the photo scales down automatically while staying fully visible. Keep it clean and Outlook-friendly.',
                '- Compliance: Use the exact footer disclaimer provided below. NEVER quote specific rates anywhere.',
                '- COMPLIANCE (CRITICAL - NEVER BREAK): NEVER quote, mention, suggest, or imply ANY specific mortgage interest rates, APRs, current rates, or loan rates in ANY section (Market Update, Industry News, Current News, or elsewhere). Use only general language like "rates have fluctuated recently" WITHOUT any numbers or quotes. Violation = compliance risk.',
                '- EMAIL COMPATIBILITY (MANDATORY): Use ONLY inline styles. DO NOT include any <style> tags or class attributes. Use TABLE-BASED LAYOUTS for all structural elements. Avoid flexbox, gap, and box-shadow.',
                '- Main container: <table width="600" align="center"...> with background white.',
                '- Use consistent module spacing of 20px between sections. Main content tables should be width="600".',
                '- Sections: EACH section MUST be in its OWN nested table with background:#f9f9f9 and border-left:8px solid #00A89D to create distinct shaded card boxes with individual teal stripes. Add a spacer row <tr><td height="20"></td></tr> between sections for separation. NEVER merge sections into one cell.',
                '- For the Market Update / Market section ONLY: ALWAYS end with a "Sources" paragraph containing 1-2 HYPERLINKED credible sources. REQUIRED FORMAT (use exactly): <p style="font-size:14px; color:#666; margin-top:20px;">Sources: <a href="https://www.freddiemac.com/pmms" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">Freddie Mac PMMS</a>, <a href="https://www.mortgagenewsdaily.com" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">Mortgage News Daily</a></p>. Use ONLY real, permanent URLs from trusted sites like Freddie Mac, Mortgage News Daily, NAR, HousingWire, or MBA. NEVER plain text names — links are mandatory.',
                '- For the Industry News / Industry Insights section ONLY: Same as above — ALWAYS include 1-2 HYPERLINKED sources in the exact format. Examples: <a href="https://www.mba.org/news-and-research" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">Mortgage Bankers Association</a>, <a href="https://nationalmortgagenews.com" style="color:#00A89D; text-decoration:underline;" target="_blank" rel="noopener">National Mortgage News</a>.',
                '- BLOG RULE (VERY IMPORTANT): DO NOT create any "From the Blog", "Blog Highlight", "My Recent Blog", or similar blog section yourself. Leave the exact placeholder <!-- BLOG SECTION PLACEHOLDER --> untouched (it goes right before the Personal Note Section). The blog section will be automatically injected in post-processing ONLY if the user checked the "Include Blog" box and provided a URL. Never output a blog section on your own.',
                '',
                'OUTPUT ONLY complete standalone HTML. Follow the header exactly. Then generate 4 or more full main content sections (Market Update, Industry Insights, Local Flavor, Client Story/Win, etc.) as complete teal cards using the exact format shown in the example cards below. Fill with real content per the CRITICAL RULES. Do not leave the comment or output placeholders for sections - expand them. After the sections, append exactly the skeleton for the placeholders and footer (do not change it). Leave the placeholders untouched for post-processing.',
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
    '    <!-- MAIN CONTENT SECTIONS: generate 4+ full teal cards here (copy the format of the example cards below, but use real generated content per rules) -->',
    '    <tr><td><table width="100%" ... teal card ...> ... </table></td></tr>',
    '    <tr><td height="20"></td></tr>',
    '    <!-- BLOG SECTION PLACEHOLDER -->',
    '    <!-- Personal Note Section -->',
    '    <tr><td><table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; border-left:8px solid #00A89D; border-collapse:separate;">',
    '      <tr><td style="padding:30px;">',
    '        <h2 style="color:#002B5C; font-size:26px; margin:0 0 20px;">A Note From [Name]</h2>',
    '        <p style="margin:15px 0 25px; font-size:18px; line-height:1.6;">[Polished personal update]</p>',
    '        [PERSONAL PHOTO PLACEHOLDER]',
    '      </td></tr>',
    '    </table></td></tr>',
    '    <tr><td height="20"></td></tr>',
    '    <!-- REFERRAL CTA PLACEHOLDER -->',
    '    <tr><td style="padding:20px; background:#002B5C; color:white; text-align:center; font-size:8px;"> ... disclaimer ... </td></tr>',
    '  </table>',
    '</bo' + 'dy>',
    '</ht' + 'ml>'
];
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
        
        alert('Newsletter generation failed. No content created — please try again.');
        
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
            // Core replacements
            // More robust placeholder replacement to handle slight variations in AI output (whitespace, self-closing, extra attrs)
            html = html.replace(/<p[^>]*id=["']?fun-fact-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p>${selectedFunFact}</p>`);
            html = html.replace(/<p[^>]*id=["']?pro-tip-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p>${selectedProTip}</p>`);
            html = html.replace(/<p[^>]*id=["']?quote-placeholder["']?[^>]*>[\s\S]*?<\/p>/gi, `<p><em>${selectedQuote}</em></p>`);
         
            // === PERSONAL PHOTO AND VIDEO - CRM / HubSpot Friendly ===
            // FIXED: Do not nest the media tables inside the Personal Note's inner <td style="padding:30px">.
            // Previously, 600px-wide tables (photo + video) inside a padded cell caused width overflows in email clients,
            // breaking the personal note box, slicing the video thumbnail into strips, and mis-aligning later sections.
            // Now: photo (if any) is inserted cleanly *inside* the note (fitted to ~540px to respect padding + left border).
            // Video (if any) is inserted as its own top-level peer section (like referral/others) right before the referral.
            // This keeps the flat <tr><td><table teal...> structure intact for all email clients.
            const includePhoto = document.getElementById('nl-include-photo')?.checked || false;
            const includeVideo = document.getElementById('nl-include-video')?.checked || false;
            const personalPhotoUrl = document.getElementById('nl-personal-photo')?.value.trim() || '';
            const personalVideoUrl = document.getElementById('nl-personal-video')?.value.trim() || '';

            let photoInsert = '';
            if (includePhoto && personalPhotoUrl) {
                photoInsert = `
<table align="center" width="100%" cellpadding="0" cellspacing="0" style="margin:15px 0; max-width:100%;">
    <tr>
        <td align="center" style="padding:4px; background:#00A89D; text-align:center; border-radius:12px;">
            <img src="${personalPhotoUrl}" alt="Personal photo" 
                 style="width:100%; max-width:540px; height:auto; display:block; border-radius:8px;">
        </td>
    </tr>
</table>`;
            }

            let videoTable = '';
            if (includeVideo && personalVideoUrl) {
                let videoId = '';
                let thumbnailUrl = 'https://via.placeholder.com/560x315/002B5C/FFFFFF?text=Watch+Video';

                const url = personalVideoUrl.trim();

                if (url.includes('youtube.com/shorts/')) {
                    videoId = url.split('shorts/')[1]?.split(/[?&]/)[0];
                } else if (url.includes('youtu.be/')) {
                    videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
                } else if (url.includes('v=')) {
                    videoId = url.split('v=')[1]?.split('&')[0];
                } else if (url.includes('embed/')) {
                    videoId = url.split('embed/')[1]?.split(/[?&]/)[0];
                }

                if (videoId && videoId.length === 11) {
                    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                }

                videoTable = `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; border-left:8px solid #00A89D; border-collapse:separate;">
  <tr>
    <td style="padding:30px;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto;">
        <tr>
          <td align="center" style="padding-bottom:16px;">
            <p style="margin:0; font-size:19px; color:#002B5C; font-weight:700;">Personal Video Update</p>
          </td>
        </tr>
        <tr>
          <td align="center">
            <a href="${personalVideoUrl}" target="_blank" rel="noopener" style="text-decoration:none;">
              <table align="center" width="100%" cellpadding="0" cellspacing="0" style="border:3px solid #00A89D; border-radius:12px; overflow:hidden; max-width:560px;">
                <tr>
                  <td style="padding:0;">
                    <img src="${thumbnailUrl}" 
                         alt="Watch Personal Video" 
                         width="560" 
                         style="width:100%; max-width:560px; height:auto; display:block; border:0;">
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:18px;">
            <!-- Outlook-friendly button -->
            <table align="center" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td align="center" bgcolor="#F15A29" style="border-radius:30px;">
                  <a href="${personalVideoUrl}" target="_blank" rel="noopener" 
                     style="display:inline-block; padding:16px 40px; color:white; font-weight:bold; font-size:19px; text-decoration:none; border-radius:30px;">
                      ▶ Watch Video
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
            }

            // Clean placeholder inside personal note (photo goes here if provided; keeps note + photo together)
            html = html.replace(/\[PERSONAL PHOTO PLACEHOLDER\]/gi, photoInsert);

// Blog injection - robust version using dedicated placeholder + fallbacks
const includeBlog = document.getElementById('nl-include-blog')?.checked || false;
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
                                <p style="margin-bottom:15px;">Discover the latest insights on homeownership and mortgage strategies in this recent article.</p>
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

// === PERSONAL NOTE HEADLINE - Force ONLY first name (no last name) ===
html = html.replace(/A Note From \[Name\]/gi, `A Note From ${firstName}`);
html = html.replace(/A Note From Adam/gi, `A Note From ${firstName}`);
html = html.replace(/A Note from Adam/gi, `A Note From ${firstName}`);
// Force personal note title to ALWAYS use only the first name (no last name allowed)
html = html.replace(/A Note From [^<]+/gi, `A Note From ${firstName}`);

// === ROBUST VIDEO INCLUSION: always force if UI enabled (checkbox + URL), strip any AI version first ===
if (includeVideo && personalVideoUrl) {
    // Strip AI-generated video
    html = html.replace(/<tr>\s*<td>\s*<table[^>]*>[\s\S]*?Personal Video Update[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>/gi, '');
    const videoSection = `
<tr><td height="20"></td></tr>
<tr>
  <td>
${videoTable}
  </td>
</tr>
<tr><td height="20"></td></tr>`;
    // Insert before referral text if present, else before footer
    if (html.includes('Know Someone Ready to Buy or Refinance?')) {
        html = html.replace(/<tr>\s*<td>\s*<table[^>]*>[\s\S]*?Know Someone Ready to Buy or Refinance\?[\s\S]*?<\/table>\s*<\/td>\s*<\/tr>/i, videoSection + '$&');
    } else {
        html = html.replace(
            /(<tr><td style="padding:20px; background:#002B5C; color:white; text-align:center; font-size:8px;)/i,
            videoSection + '\n<tr><td height="20"></td></tr>\n$1'
        );
    }
}

// === REFERRAL - Updated (no phone number) ===
const simpleReferralHTML = `
<tr>
  <td>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; border-left:8px solid #00A89D; border-collapse:separate;">
      <tr>
        <td style="padding:30px 30px 30px 30px; text-align:center;">
          <h2 style="color:#002B5C; font-size:26px; margin:0 0 20px;">Know Someone Ready to Buy or Refinance?</h2>
          <p style="margin:0 0 25px; font-size:18px; line-height:1.6; color:#002B5C;">Hook me up – forward this or smash the button, I'll make 'em laugh all the way to closing!</p>
          
          <!-- Outlook-friendly button -->
          <table align="center" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center" bgcolor="#F15A29" style="border-radius:30px; padding:4px;">
                <a href="mailto:${document.getElementById('nl-email').value || ''}?subject=Referral from a Friend — Ready for Mortgage Help!&body=Hi ${firstName},%0A%0AI'd like to refer someone who's interested in mortgage options.%0A%0AName: %0APhone: %0AEmail: %0AThey're looking for: (buying / refinancing / other)%0A%0AThanks!%0A%0A" 
                   style="display:inline-block; padding:18px 40px; color:white; font-weight:bold; font-size:20px; text-decoration:none; border-radius:26px;">
                    Send Me a Referral
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

html = html.replace(/\[REFERRAL CTA PLACEHOLDER\]/gi, simpleReferralHTML);
html = html.replace(/\[Email\]/g, document.getElementById('nl-email').value || '');
html = html.replace(/\[Name\]/g, firstName);

// === ROBUST FALLBACK ENSURE: Always include referral section at the bottom ===
// The AI occasionally omits the [REFERRAL CTA PLACEHOLDER] or generates its own version.
// This (combined with the pre-referral video insert) guarantees video (when checked) + referral.
if (!html.includes('Know Someone Ready to Buy or Refinance?')) {
    html = html.replace(
        /(<tr><td style="padding:20px; background:#002B5C; color:white; text-align:center; font-size:8px;)/i,
        simpleReferralHTML + '\n<tr><td height="20"></td></tr>\n$1'
    );
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
    alert('Newsletter downloaded! Double-click the file to preview.');
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
        alert('Generate the newsletter first!');
        return;
    }

    const blob = new Blob([cleanHTML], { type: 'text/html' });
    const data = [new ClipboardItem({ 'text/html': blob })];

    navigator.clipboard.write(data).then(() => {
        alert('✅ Outlook-optimized HTML copied!\n\nPaste into a NEW email in Outlook.');
    }).catch(err => {
        console.error(err);
        alert('Clipboard issue — try the regular Copy HTML button instead.');
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
      alert('Saved Items system not ready yet. Please try again in a moment.');
      return;
    }
    const clean = getCleanOutlookHTML();
    if (!clean) {
      alert('Generate the newsletter first!');
      return;
    }
    const title = (document.getElementById('nl-title') && document.getElementById('nl-title').value) || 'My Newsletter';
    window.toggleSaveIdea(title, clean, null, 'newsletter');
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
    window.openModal = openModal;
    window.openNewsletterChoiceModal = openModal;
  }
  if (typeof closeModal === 'function') window.closeModal = closeModal;
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

  function syncNewsletterFromProfile() {
    try {
      const p = getCentralProfile();
      const nameEl = document.getElementById('nl-name');
      const emailEl = document.getElementById('nl-email');
      const locEl = document.getElementById('nl-location');
      if (nameEl && p.name && !nameEl.value) nameEl.value = p.name;
      if (emailEl && (p.email || p.workEmail) && !emailEl.value) emailEl.value = p.email || p.workEmail || '';
      if (locEl && (p.localArea || p.market) && (!locEl.value || locEl.value === 'Fort Wayne, Indiana')) {
        locEl.value = p.localArea || p.market || locEl.value;
      }
      // Silent profile sync — no toast to avoid corner popups on load

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

    const fill = parts.join(' ') || 'Excited to help more families achieve homeownership this year!';
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

    // Initial profile sync (non-destructive)
    setTimeout(() => {
      if (typeof syncNewsletterFromProfile === 'function') syncNewsletterFromProfile();
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

    // Auto-populate personal update from profile on load (silently, so doesn't force focus/toast if not wanted)
    // This ensures profile info (hobbies, personality, goals, challenges) comes over when page/section first loads.
    setTimeout(() => {
      if (typeof fillPersonalFromProfile === 'function') {
        try { fillPersonalFromProfile(true); } catch(e){ console.warn('auto fill personal failed', e); }
      }
    }, 120);

    // Restore last generated newsletter (raw + visual preview) so the previous version is present after refresh
    // until the user Clears or generates a replacement.
    if (typeof restoreLastNewsletter === 'function') {
      try { restoreLastNewsletter(); } catch (e) {}
    }

    console.log('%c[newsletter-generator.js] Newsletter Generator initialized', 'color:#00A89D');
  }

  window.syncNewsletterFromProfile = syncNewsletterFromProfile;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewsletterGenerator);
  } else {
    initNewsletterGenerator();
  }

})();
