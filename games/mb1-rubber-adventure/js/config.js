// ============================================================
//  MB1 CONFIG — chapters, themes, game state
//  (mirrors structure of mb3 config.js — different content)
// ============================================================
'use strict';

const GAME_W = 960;
const GAME_H = 540;

const PHYS = {
  GRAVITY: 1400,
  MOVE_MAX: 260,
  MOVE_ACCEL: 1800,
  JUMP_POWER: 520,
  DOUBLE_JUMP_POWER: 460,
  // Per-frame velocity multipliers when no input — closer to 1.0 = smoother glide.
  // 0.78 was way too sticky; 0.90 ground / 0.97 air feels like a platformer.
  FRICTION_AIR: 0.97,
  FRICTION_GROUND: 0.90,
  // Variable-height jump: when player releases jump while still moving up,
  // dampen upward velocity instead of hard-cutting it.
  JUMP_RELEASE_DAMP: 0.45,
  // Coyote time: brief grace window after walking off a ledge during which
  // the player can still jump. Frames @ 60fps.
  COYOTE_FRAMES: 6,
  // Jump buffer: if player presses jump shortly before landing, it still fires.
  JUMP_BUFFER_FRAMES: 6,
  THROW_VEL_X: 540,
  THROW_VEL_Y: -130,
  THROW_GRAVITY: 750,
};

// ----- CHAPTERS — 9-chapter rubber history journey -----
// Each chapter has quizGates (1-2 mid-level question barriers) and
// bossQuestions (the boss fight is a quiz; each question is a phase
// the player damages the boss to unlock). Content ported verbatim
// from the canvas MB1.
const CHAPTERS = [
  {
    num: 1,
    title: "Introduction",
    subtitle: "A Material Older Than Ancient Egypt",
    intro: "Your journey begins. Run, jump, and throw rubber balls to defeat enemies. Reach the end of each chapter — but watch out for question gates that block your path!",
    theme: "rainforest_dawn",
    bossName: "The Question Sentinel",
    quizGates: [
      {
        q: "Roughly how many years ago was rubber FIRST invented?",
        a: ["About 500 years ago", "About 1,000 years ago", "About 3,500 years ago", "About 10,000 years ago"],
        correct: 2,
        explain: "Rubber was invented over 3,500 years ago — older than the founding of ancient Rome."
      }
    ],
    bossQuestions: [
      {
        q: "Where in the world was rubber first invented?",
        a: ["Ancient China", "Mesoamerica (Mexico/Central America)", "The Amazon rainforest", "Ancient Egypt"],
        correct: 1,
        explain: "Mesoamerica — the region we now call Mexico and Central America — is where rubber was first invented."
      },
      {
        q: "Which of these is NOT typically made of rubber today?",
        a: ["Car tires", "Pencil erasers", "Glass windows", "Doctor's gloves"],
        correct: 2,
        explain: "Glass windows are made of, well, glass! Tires, erasers, and gloves all use rubber."
      }
    ]
  },
  {
    num: 2,
    title: "What Was Mesoamerica?",
    subtitle: "Lost cities and ancient civilizations",
    intro: "Welcome to Mesoamerica! Cross through territories of the Olmec, Maya, and Aztec. Beware of jungle creatures — and a sentinel guarding the way to the next chapter.",
    theme: "rainforest",
    bossName: "Guardian of the Stone Heads",
    quizGates: [
      {
        q: "What does the word 'Mesoamerica' literally mean?",
        a: ["Rainforest America", "Middle America", "Ancient America", "Lost America"],
        correct: 1,
        explain: "'Meso' is Greek for 'middle,' so Mesoamerica means 'Middle America' — the region between North and South America."
      },
      {
        q: "Which civilization is called the 'mother culture' of Mesoamerica?",
        a: ["The Aztecs", "The Maya", "The Olmec", "The Inca"],
        correct: 2,
        explain: "The Olmec are called the 'mother culture' because so many later civilizations borrowed from them."
      }
    ],
    bossQuestions: [
      {
        q: "What does the word 'Olmec' mean in the Aztec language?",
        a: ["The stone people", "The rubber people", "The forest people", "The ancient ones"],
        correct: 1,
        explain: "'Olmec' means 'the rubber people' — they were named for the very thing they invented."
      },
      {
        q: "What was the capital city of the Aztec Empire?",
        a: ["Teotihuacán", "Chichén Itzá", "Tenochtitlán", "Palenque"],
        correct: 2,
        explain: "Tenochtitlán was the Aztec capital, built on an island in a lake in 1325 CE."
      },
      {
        q: "Why couldn't rubber trees grow near the Aztec capital?",
        a: ["The soil was too rocky", "It was too high and cool", "There were too many people", "Animals ate them"],
        correct: 1,
        explain: "Tenochtitlán sat in a high, cool valley. Rubber trees only grow in warm tropical lowlands, so the Aztecs had to trade for rubber."
      }
    ]
  },
  {
    num: 3,
    title: "The Tree, the Vine, and a Stroke of Genius",
    subtitle: "Ancient chemistry, decoded",
    intro: "It's time to learn the Olmec recipe. Tap latex from trees, gather morning glory vines, and combine them. The Master Chemist awaits at the end of the level.",
    theme: "deep_forest",
    bossName: "The Master Chemist",
    quizGates: [
      {
        q: "What is LATEX?",
        a: ["A type of stone", "Milky white tree sap", "A kind of bird", "Dried clay"],
        correct: 1,
        explain: "Latex is the milky white sap that drips out when you cut the bark of a rubber tree."
      },
      {
        q: "What plant did the Olmec mix with latex to make rubber?",
        a: ["Cactus juice", "Morning glory vine", "Pine sap", "Maize syrup"],
        correct: 1,
        explain: "Morning glory vine (Ipomoea alba) contains chemicals that turn sticky latex into stretchy rubber."
      }
    ],
    bossQuestions: [
      {
        q: "What scientific name do we use for the rubber tree of Mesoamerica?",
        a: ["Hevea brasiliensis", "Castilla elastica", "Ficus elastica", "Quercus rubra"],
        correct: 1,
        explain: "Castilla elastica — the Mesoamerican rubber tree. (Hevea brasiliensis is the Amazon rubber tree, used today.)"
      },
      {
        q: "What does the morning glory juice DO to latex at the molecular level?",
        a: ["It dries it out", "It dyes it black", "It cross-links the polymer chains", "It freezes it solid"],
        correct: 2,
        explain: "It cross-links the polymer chains — creating tiny chemical 'bridges' that connect long molecules and make the material bouncy and stretchy."
      },
      {
        q: "What is the modern name for this whole process of cross-linking rubber?",
        a: ["Polymerization", "Vulcanization", "Coagulation", "Crystallization"],
        correct: 1,
        explain: "It's called vulcanization! The Olmec invented it 3,000+ years before Charles Goodyear 'rediscovered' it in 1839."
      },
      {
        q: "What ratio of latex-to-vine juice did the Olmec use to make a BOUNCY BALL?",
        a: ["3 parts latex, 1 part vine", "1 part latex, 3 parts vine", "50/50 (equal parts)", "Pure latex, no vine"],
        correct: 2,
        explain: "MIT scientists found a 50/50 mix made the bounciest balls. Different ratios made different products!"
      }
    ]
  },
  {
    num: 4,
    title: "Daily Life and Sacred Ceremony",
    subtitle: "The Mesoamerican ballgame",
    intro: "Welcome to the great ballcourt! Mesoamericans used rubber for sandals, glue, syringes — and most famously, a ballgame played in stone courts across the land.",
    theme: "ballcourt",
    bossName: "Champion of the Ballcourt",
    quizGates: [
      {
        q: "About how heavy was a Mesoamerican rubber ball?",
        a: ["About 1 pound (like a baseball)", "About 8 pounds (like a bowling ball)", "About 20 pounds (like a watermelon)", "About 50 pounds (like a bag of dog food)"],
        correct: 1,
        explain: "A solid rubber ballgame ball weighed up to 8 pounds — about as heavy as a bowling ball!"
      },
      {
        q: "Which body parts could players use to hit the ball?",
        a: ["Hands and feet only", "Heads only", "Hips, knees, and elbows", "Any body part"],
        correct: 2,
        explain: "Players struck the ball with their hips, knees, and elbows — never with hands or feet."
      }
    ],
    bossQuestions: [
      {
        q: "What shape were Mesoamerican ballcourts viewed from above?",
        a: ["Like a circle", "Like a capital letter 'I'", "Like a square", "Like a triangle"],
        correct: 1,
        explain: "Most ballcourts were shaped like a capital 'I' — two end zones with a long alley between them."
      },
      {
        q: "Besides being a sport, what else was the ballgame?",
        a: ["Just entertainment for kids", "A way to settle disputes between cities", "A method of teaching math", "A way to grow crops"],
        correct: 1,
        explain: "Cities sometimes played the ballgame to settle disputes instead of going to war!"
      },
      {
        q: "Roughly how many ancient ballcourts have archaeologists found across Mesoamerica?",
        a: ["About 50", "About 200", "Over 1,500", "Over 100,000"],
        correct: 2,
        explain: "Over 1,500 ballcourts have been found at ancient sites — almost every important city had one."
      }
    ]
  },
  {
    num: 5,
    title: "The Age of Exploration Arrives",
    subtitle: "When two worlds collided",
    intro: "Spanish ships approach the coast. The two halves of the world are about to meet for the first time. Watch out for armored sentinels guarding the path.",
    theme: "coast",
    bossName: "The Galleon Captain",
    quizGates: [
      {
        q: "When was the Age of Exploration, roughly?",
        a: ["1000–1200", "1400–1600", "1700–1900", "1900–2000"],
        correct: 1,
        explain: "The Age of Exploration ran roughly from 1400 to 1600 — when European sailors began crossing the world's oceans."
      },
      {
        q: "Who reached the Americas in 1492?",
        a: ["Hernán Cortés", "Christopher Columbus", "Charles Goodyear", "Henry Wickham"],
        correct: 1,
        explain: "Christopher Columbus reached the Americas in 1492 — though he thought he had landed near India!"
      }
    ],
    bossQuestions: [
      {
        q: "Who led the Spanish conquest of the Aztec Empire in 1519–1521?",
        a: ["Christopher Columbus", "Hernán Cortés", "King Charles V", "Charles de la Condamine"],
        correct: 1,
        explain: "Hernán Cortés led the Spanish expedition that toppled the Aztec Empire."
      },
      {
        q: "Why did rubber balls amaze the Spanish so much?",
        a: ["They were rare and expensive", "They were brightly colored", "European balls didn't bounce", "They could float on water"],
        correct: 2,
        explain: "European balls were stuffed with hair or feathers and barely bounced. Rubber balls seemed almost magical!"
      },
      {
        q: "In 1528, who did Cortés bring to Spain to perform the ballgame?",
        a: ["Maya priests", "Aztec ball players", "Olmec sculptors", "Inca soldiers"],
        correct: 1,
        explain: "Cortés brought Aztec ball players to perform for King Charles V — the first ballgame ever played outside the Americas."
      }
    ]
  },
  {
    num: 6,
    title: "The Hard Truth",
    subtitle: "What conquest really brought",
    intro: "This is a difficult chapter. The Spanish ships brought more than ambition — they brought disease and destruction. Travel through these dark times to understand what was lost.",
    theme: "ruins",
    bossName: "The Specter of Loss",
    quizGates: [
      {
        q: "What was the BIGGEST cause of death for Indigenous people after the Spanish arrived?",
        a: ["Sword fights", "European diseases like smallpox", "Starvation", "Earthquakes"],
        correct: 1,
        explain: "Diseases like smallpox killed far more people than warfare. Indigenous peoples had no immunity to Old World diseases."
      },
      {
        q: "By 1600, what had happened to the population of Mexico?",
        a: ["It had grown a little", "It had stayed the same", "It fell by 80–90%", "It moved to Spain"],
        correct: 2,
        explain: "An estimated 80–90% of Mexico's population died in the 1500s — one of the largest population collapses in history."
      }
    ],
    bossQuestions: [
      {
        q: "What was the encomienda system?",
        a: ["A type of farming tool", "A Spanish system of forced labor", "An Aztec calendar", "A kind of music"],
        correct: 1,
        explain: "The encomienda was a Spanish system that gave settlers the 'right' to demand tribute and labor from Indigenous people — often brutally."
      },
      {
        q: "Who was Bartolomé de las Casas?",
        a: ["A Spanish soldier who fought the Aztecs", "A Spanish priest who DEFENDED Indigenous rights", "An Aztec emperor", "An English explorer"],
        correct: 1,
        explain: "Las Casas was a Spanish priest who spent his life writing books and pleading with the king to stop the abuse of Indigenous peoples."
      },
      {
        q: "Did Indigenous peoples of Mesoamerica disappear after the conquest?",
        a: ["Yes, completely", "No — millions still speak Indigenous languages today", "They moved to Europe", "Only a few hundred survived"],
        correct: 1,
        explain: "Indigenous peoples survived. Today, over 1.5 million people speak Nahuatl (Aztec) and 6 million speak Mayan languages."
      }
    ]
  },
  {
    num: 7,
    title: "Rubber Crosses the Ocean",
    subtitle: "Slowly...",
    intro: "Rubber arrived in Europe in the 1500s. But for over 200 years, it sat unused! Help carry knowledge across centuries to find a way to make rubber actually useful.",
    theme: "europe",
    bossName: "The Curiosity Cabinet",
    quizGates: [
      {
        q: "After Cortés brought rubber to Spain, how long did it sit mostly unused in Europe?",
        a: ["About 5 years", "About 50 years", "Over 200 years", "Over 1,000 years"],
        correct: 2,
        explain: "Over 200 years! Europeans saw rubber as a curiosity but had no idea how to use it practically."
      },
      {
        q: "What French scientist studied rubber in South America in 1735?",
        a: ["Charles Goodyear", "Charles de la Condamine", "Christopher Columbus", "Henry Wickham"],
        correct: 1,
        explain: "Charles de la Condamine sent the first scientific descriptions of rubber from the Amazon back to Paris."
      }
    ],
    bossQuestions: [
      {
        q: "Why didn't pure rubber work well in early Europe?",
        a: ["It was too expensive", "It melted in summer and cracked in winter", "It was illegal", "It was poisonous"],
        correct: 1,
        explain: "Without vulcanization, rubber melted in heat and cracked in cold. That's why Europeans needed to rediscover the Olmec secret."
      },
      {
        q: "Who gave rubber its English name in the 1770s?",
        a: ["Joseph Priestley (the oxygen guy)", "Isaac Newton", "Benjamin Franklin", "Albert Einstein"],
        correct: 0,
        explain: "Joseph Priestley noticed it could rub out pencil marks — so he called it 'rubber.' The name stuck!"
      },
      {
        q: "Who 'rediscovered' vulcanization in 1839?",
        a: ["Charles de la Condamine", "Charles Goodyear", "Henry Wickham", "Joseph Priestley"],
        correct: 1,
        explain: "Charles Goodyear figured it out using sulfur and heat — over 3,000 years after the Olmec did it with morning glory juice!"
      }
    ]
  },
  {
    num: 8,
    title: "From Curiosity to Global Industry",
    subtitle: "The seeds that changed everything",
    intro: "The Industrial Revolution roars to life. Rubber is suddenly worth a fortune — and the great Amazon rubber boom is about to begin. But who controls the seeds controls the future.",
    theme: "amazon",
    bossName: "The Rubber Baron",
    quizGates: [
      {
        q: "In the late 1800s, where did almost all the world's rubber come from?",
        a: ["Mexico", "The Amazon rainforest", "Africa", "Asia"],
        correct: 1,
        explain: "Wild Hevea trees in the Amazon supplied almost all the world's rubber until the early 1900s."
      },
      {
        q: "Who smuggled 70,000 rubber tree seeds out of the Amazon in 1876?",
        a: ["Charles Goodyear", "Henry Wickham", "Charles de la Condamine", "Hernán Cortés"],
        correct: 1,
        explain: "Henry Wickham took 70,000 Hevea seeds to Kew Gardens in England — about 2,400 of them sprouted."
      }
    ],
    bossQuestions: [
      {
        q: "Where were Wickham's seeds eventually planted?",
        a: ["Spain", "Mexico", "Southeast Asia (Sri Lanka, Malaysia, Indonesia)", "Australia"],
        correct: 2,
        explain: "The British shipped seedlings to their Asian colonies, where huge rubber plantations soon dominated the world supply."
      },
      {
        q: "What was the Putumayo scandal?",
        a: ["A scientific discovery", "Atrocities against Indigenous Amazonian rubber tappers", "A type of rubber tree disease", "A famous ballgame match"],
        correct: 1,
        explain: "Around 1900–1912, a rubber company in the Putumayo region committed terrible atrocities against Indigenous workers, killing tens of thousands."
      },
      {
        q: "Today, what country produces the MOST natural rubber?",
        a: ["Brazil", "Mexico", "Thailand", "United States"],
        correct: 2,
        explain: "Thailand! Indonesia and Vietnam are #2 and #3. Almost no commercial rubber comes from the Americas anymore."
      },
      {
        q: "Why did synthetic rubber suddenly become important in the 1940s?",
        a: ["A scientist invented it for fun", "World War II cut off Asian rubber supplies", "Trees stopped growing", "It was cheaper than coffee"],
        correct: 1,
        explain: "When Japan captured Asian rubber regions in WWII, the U.S. raced to develop synthetic rubber from petroleum chemicals."
      }
    ]
  },
  {
    num: 9,
    title: "Conclusion: A Legacy in Every Bounce",
    subtitle: "The final challenge",
    intro: "The end of your journey approaches. Face the Final Sentinel — a guardian of all you've learned about 3,500 years of rubber's story.",
    theme: "modern",
    bossName: "The Final Sentinel",
    quizGates: [
      {
        q: "What's the most important lesson about who invents things?",
        a: ["Only Europeans invent important things", "Human ingenuity is universal — it happens everywhere", "Only modern people invent things", "Inventions are random luck"],
        correct: 1,
        explain: "Human ingenuity is universal. Sophisticated science was happening on every populated continent long before global trade connected them."
      }
    ],
    bossQuestions: [
      {
        q: "Roughly how old is the FIRST evidence of rubber-making?",
        a: ["About 500 years old", "About 1,500 years old", "About 3,500 years old", "About 10,000 years old"],
        correct: 2,
        explain: "About 3,600 years old! Twelve ancient rubber balls were found at El Manatí in Mexico, dating to around 1600 BCE."
      },
      {
        q: "If you bounce a rubber ball today, you're using technology first invented by...",
        a: ["Charles Goodyear in 1839", "Henry Ford in 1908", "The Olmec in ~1600 BCE", "NASA in 1969"],
        correct: 2,
        explain: "The Olmec figured out the basic chemistry of rubber over 3,500 years ago. Goodyear's vulcanization came later."
      },
      {
        q: "What's the BIG takeaway from rubber's story?",
        a: ["Inventions only matter if Europeans use them", "Indigenous peoples never invented anything", "Brilliant science happens everywhere, and ideas travel — but exchange is rarely fair", "Rubber is bad for the environment"],
        correct: 2,
        explain: "Brilliant science happens everywhere. Ideas travel between cultures — but the exchange has often come with great cost to the people who invented them."
      },
      {
        q: "Today, what percent of natural rubber comes from the Americas (where it was invented)?",
        a: ["Almost all of it", "About 50%", "Less than 10%", "Exactly 25%"],
        correct: 2,
        explain: "Less than 10%! Over 90% of natural rubber today comes from Asia. The trees took a long journey from where they began."
      }
    ]
  }
];

// ----- THEMES — palette per chapter (ported from canvas MB1) -----
// hex strings used for sky gradients (drawn into Phaser graphics);
// numeric 0xRRGGBB used for tinting sprites.
const THEMES = {
  rainforest_dawn: { sky: ['#f5b86c','#d97a5a','#5a3a4a'], ground: 0x3d2c1f, groundTop: 0x5d4a26, accent: 0x7fb069, dust: 0xc9a23a },
  rainforest:      { sky: ['#88c474','#3d6b2c','#1e3a1a'], ground: 0x2d1f12, groundTop: 0x5a3a1f, accent: 0x7fb069, dust: 0xa8d49a },
  deep_forest:     { sky: ['#1a3c2a','#0d2818','#050f0a'], ground: 0x1a0f08, groundTop: 0x2e2010, accent: 0xa8c97d, dust: 0x7fb069, stars: true, fog: true },
  ballcourt:       { sky: ['#e8c878','#c9a23a','#7a5a30'], ground: 0xa08654, groundTop: 0xc9a76b, accent: 0xc0392b, dust: 0xf5e6c8, stone: true },
  coast:           { sky: ['#a8c8e8','#5d8aae','#2e4a6a'], ground: 0x3a4a5a, groundTop: 0x6a8aae, accent: 0xd4b88a, dust: 0xcfe6f2, water: true },
  ruins:           { sky: ['#5a3a2a','#2a1a14','#0a0505'], ground: 0x1a0a05, groundTop: 0x3a2010, accent: 0x7a1a13, dust: 0x888888, stars: true, fog: true, somber: true },
  europe:          { sky: ['#8a96a6','#5a6a7a','#2e3a48'], ground: 0x3a3530, groundTop: 0x5a554e, accent: 0xc9a23a, dust: 0xd4cfc4, snow: true },
  amazon:          { sky: ['#5a7a3a','#2a4a1a','#0a1a05'], ground: 0x1a1208, groundTop: 0x3a2810, accent: 0xc0392b, dust: 0x7fb069, fog: true },
  modern:          { sky: ['#1a1a2e','#0e0e1a','#000000'], ground: 0x1a1a2a, groundTop: 0x3a3a4a, accent: 0xf4c842, dust: 0x88aacc, stars: true, neon: true }
};

// ----- GAME STATE — mutable, lives across scenes -----
const GAME = {
  chapterIdx: 0,
  hp: 3,
  maxHp: 3,
  invincibleUntil: 0,
  muted: false,
  // Quiz state — persists answered-correctly state for replays of a chapter
  // (so a player who beats a gate doesn't have to re-answer if they die).
  // Keyed by `${chapterIdx}-gate-${gateIdx}` and `${chapterIdx}-boss-${qIdx}`.
  answeredCorrect: new Set(),
};

function resetGame() {
  GAME.chapterIdx = 0;
  GAME.hp = GAME.maxHp;
  GAME.invincibleUntil = 0;
  GAME.answeredCorrect = new Set();
}

// On chapter retry, preserve what they've already answered
// (and the chapter index) so they don't redo the whole quiz.
function restartChapter() {
  GAME.hp = GAME.maxHp;
  GAME.invincibleUntil = 0;
}
