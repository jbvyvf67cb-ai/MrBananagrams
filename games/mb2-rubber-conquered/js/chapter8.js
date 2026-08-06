// ============================================================
//  CHAPTER 8 — Goodyear's Workshop (1839, Connecticut)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_8 = {
  num: 8,
  title: "Goodyear's Workshop",
  subtitle: 'A man, a stove, and an accident',
  era: '1839',
  location: 'Woburn, Massachusetts',
  intro: "By the 1830s, raw rubber from Brazil is cheap and being sold in Europe and America. There is one terrible problem: it melts in summer and cracks in winter, ruining anything made from it. A bankrupt obsessive named Charles Goodyear has spent five years trying to fix it. Today, in this dim workshop, he is going to drop a piece on a hot stove. The world is about to change.",
  theme: 'factory_workshop',
  bossName: 'Charles Goodyear',
  bossPortrait: 'goodyear',
  bossRole: 'Inventor (and impoverished obsessive)',
  bossIntro: 'A thin, exhausted-looking man in a stained leather apron stands by a small iron stove. There are bottles and rubber strips everywhere. He looks at you with feverish eyes. "Tell me — did I invent something tonight, or did I just find it?"',
  combatAllowed: true,
  subAreas: [
    {
      id: 'shop',
      name: 'The Front Shop',
      width: 1100, height: 700,
      playerSpawn: { x: 80, y: 350 },
      walls: [
        { x: 200, y: 100, w: 14, h: 200 },
        { x: 200, y: 400, w: 14, h: 200 },
        { x: 600, y: 100, w: 14, h: 250 },
        { x: 600, y: 420, w: 14, h: 200 }
      ],
      exits: [
        { x: 1080, y: 320, w: 20, h: 80, target: 'workshop' }
      ],
      decorations: [
        { type: 'crate', x: 350, y: 250 }, { type: 'crate', x: 380, y: 280 },
        { type: 'crate', x: 700, y: 450 }, { type: 'crate', x: 850, y: 250 },
        { type: 'fire', x: 950, y: 400 }
      ],
      enemies: [
        { type: 'runaway_machine', behavior: 'roll', axis: 'x', x: 450, y: 350, range: 150, speed: 1.6 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'workshop_assistant',
          name: "Goodyear's Assistant",
          x: 350, y: 400,
          passage: "Mr. Goodyear has spent everything he has on rubber. His family is in poverty. His children have died. He has been thrown in debtor's prison more than once. He keeps experimenting because he believes — truly believes — there must be a way to fix the temperature problem. Cold rubber cracks like glass. Hot rubber melts and stinks. Customers return the goods. The whole industry is on the brink of failing. He thinks the answer is sulfur. He has tried sulfur a hundred times. Tonight he is trying it again.",
          questions: [{
            q: "What was the central problem Goodyear was trying to solve?",
            a: [
              'How to make rubber bouncier',
              'How to make rubber stable across temperatures — not melting in summer or cracking in winter',
              'How to make rubber cheaper',
              'How to grow rubber trees in America'
            ],
            correct: 1,
            explain: "Pre-vulcanization rubber was almost useless because of temperature. Whole companies went bankrupt selling rubber goods that fell apart in heat. Stabilizing rubber was the unlock — without it, the industrial age of rubber could not begin."
          }]
        }
      ],
      sparks: [
        { x: 500, y: 600, kind: 'sensory', text: 'Brass machinery, soot, the sweet-rotten smell of raw rubber.' },
        { x: 900, y: 600, kind: 'fact', text: 'Goodyear was self-taught. He was not a chemist. He had no university education. He just kept mixing things and trying.' }
      ]
    },
    {
      id: 'workshop',
      name: 'The Back Workshop',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      walls: [
        { x: 300, y: 100, w: 14, h: 200 },
        { x: 300, y: 400, w: 14, h: 200 },
        { x: 700, y: 0, w: 14, h: 280 },
        { x: 700, y: 380, w: 14, h: 320 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'shop' },
        { x: 1080, y: 320, w: 20, h: 80, target: 'stove' }
      ],
      decorations: [
        { type: 'crate', x: 200, y: 250 }, { type: 'crate', x: 500, y: 200 },
        { type: 'crate', x: 800, y: 500 }, { type: 'crate', x: 1000, y: 250 },
        { type: 'fire', x: 400, y: 350 }, { type: 'fire', x: 900, y: 350 }
      ],
      enemies: [
        { type: 'runaway_machine', behavior: 'roll', axis: 'y', x: 550, y: 350, range: 150, speed: 1.4 },
        { type: 'runaway_machine', behavior: 'roll', axis: 'x', x: 850, y: 600, range: 100, speed: 1.8 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Notebook Page',
          x: 400, y: 350,
          passage: "Goodyear's process — once he found it — uses heat and sulfur to chemically transform raw rubber. The sulfur atoms cross-link the long rubber molecules together, locking them into a stable structure. Whatever shape you cure the rubber in, it stays that shape. Hot or cold. He named the process vulcanization, after Vulcan, the Roman god of fire and forge. The Olmec achieved a similar molecular result with morning glory juice, three thousand years earlier — but Goodyear did not know that, and the chemistry is not exactly the same. Both worked. Both still do.",
          questions: [{
            q: 'How does vulcanization stabilize rubber?',
            a: [
              'It cools the rubber quickly',
              "It chemically cross-links the rubber molecules together, locking the structure",
              'It removes water from the rubber',
              'It coats the rubber in metal'
            ],
            correct: 1,
            explain: "Cross-linking is the trick. Without cross-links, rubber molecules slide past each other when warm and snap when cold. With cross-links, they hold their relationship to each other across temperatures. The Olmec did this with plant juice. Goodyear did it with sulfur and heat."
          }]
        }
      ],
      sparks: [
        { x: 250, y: 600, kind: 'sensory', text: 'A piece of rubber at the moment it transforms — going from sticky to stable as a chemical change locks in.' },
        { x: 950, y: 200, kind: 'prompt', text: 'When two people, separated by 3,000 years, solve the same problem differently — is one the inventor and one the rediscoverer? Or are they both inventors? Or are they both finders?' }
      ]
    },
    {
      id: 'stove',
      name: 'The Stove (where it happened)',
      width: 900, height: 600,
      playerSpawn: { x: 60, y: 300 },
      isBossArea: true,
      bossSpawn: { x: 700, y: 300 },
      walls: [
        { x: 0, y: 0, w: 900, h: 14 },
        { x: 0, y: 586, w: 900, h: 14 }
      ],
      exits: [
        { x: 0, y: 270, w: 14, h: 80, target: 'workshop' }
      ],
      decorations: [
        { type: 'fire', x: 450, y: 300 }, { type: 'fire', x: 200, y: 450 },
        { type: 'crate', x: 350, y: 200 }, { type: 'crate', x: 600, y: 450 },
        { type: 'rubble', x: 800, y: 200 }
      ],
      enemies: [],
      infoStops: [
        {
          type: 'plaque',
          name: 'The Story of the Accident',
          x: 250, y: 350,
          passage: "There are competing versions of what happened. Goodyear himself said he was demonstrating sulfur-rubber experiments to skeptical neighbors when, in his excitement, he carelessly let a piece of the mixture drop onto a hot stove. Most rubber would have melted. This one charred — but did not melt. He grabbed it, tested it. Stable. Bendable. Heat-resistant. Whether the moment was truly accidental or the careful next step in years of experimentation, he had it. The age of industrial rubber began with this small piece of charred material, in a small workshop, on a winter night in 1839.",
          questions: [{
            q: "How did Goodyear discover vulcanization?",
            a: [
              "He read about it in old Spanish chronicles",
              "An Aztec descendant told him the recipe",
              "Sulfur-rubber mixture accidentally landed on a hot stove and behaved differently than expected",
              "He bought the recipe from a French scientist"
            ],
            correct: 2,
            explain: "Goodyear's discovery was a happy accident inside a long deliberate search. The sulfur-rubber-heat combination cross-linked the molecules. He had been heading toward this for years; the stove just got him there one specific night."
          }]
        }
      ],
      sparks: [
        { x: 500, y: 450, kind: 'sensory', text: 'A small charred lump of rubber, still warm, that does not melt — held by a man who has not eaten properly in months.' },
        { x: 800, y: 400, kind: 'fact', text: "Despite inventing vulcanization, Goodyear died in poverty. The 'Goodyear Tire and Rubber Company' was founded almost forty years after his death by people unrelated to him. He never benefited from his own discovery." }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'Goodyear asks: "Did I invent something tonight, or did I just find it?"',
      a: [
        "He invented it — nobody had ever made rubber stable across temperatures before",
        "He found it — the Olmec had achieved a similar effect 3,000 years earlier with different chemistry",
        "Both are partly true: he independently arrived at the same destination by a different path",
        "Neither — the discovery was meaningless"
      ],
      correct: 2,
      explain: '"Yes," he says quietly. "I think this is the honest answer. I did not steal it. I did not know about the morning glory. But I am also not the first hand on this molecule. Both can be true."'
    },
    {
      q: "He asks: \"What does my discovery enable?\"",
      a: [
        "Bouncing balls",
        "Rain boots",
        "Bicycle tires, then automobile tires, electrical insulation, hoses, surgical gloves — the whole modern industrial world",
        "Only luxury goods"
      ],
      correct: 2,
      explain: '"All of that," he says. "And I will see almost none of it. Patents are slow. Lawsuits are long. The world will be remade by my discovery, but I will not see most of it. Strange thing to know."'
    }
  ]
};
