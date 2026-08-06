// ============================================================
//  CHAPTER 9 — Wickham, Kew, Malaya (1876 and after)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_9 = {
  num: 9,
  title: 'The Seeds Travel East',
  subtitle: 'The Olmec idea circles the planet',
  era: '1876',
  location: 'The Amazon → Kew Gardens → Malaya',
  intro: "By the 1870s, world demand for rubber has exploded — bicycles, then cars, are coming. All of it depends on wild trees in the Brazilian Amazon, where indigenous and migrant workers labor under brutal conditions. An English adventurer named Henry Wickham is about to change all that. He is going to ship 70,000 rubber tree seeds to England. From there they will travel to Asia. The Olmec idea — born in a Mexican bog 3,500 years ago — is about to circle the entire planet.",
  theme: 'kew_plantation',
  bossName: 'Henry Wickham',
  bossPortrait: 'wickham',
  bossRole: 'Adventurer, biologist, and complicated figure',
  bossIntro: 'A Victorian Englishman in a wide-brimmed hat stands among rows of seedlings, brushing dust off his hands. He fixes you with a satisfied stare. "I am sometimes called a hero. I am sometimes called a thief. Tell me — can you hold both ideas at once?"',
  combatAllowed: true,
  subAreas: [
    {
      id: 'amazon',
      name: 'The Amazon Loading Docks',
      width: 1200, height: 700,
      playerSpawn: { x: 80, y: 350 },
      walls: [
        { x: 0, y: 100, w: 1200, h: 14 },
        { x: 0, y: 586, w: 1200, h: 14 }
      ],
      exits: [
        { x: 1180, y: 320, w: 20, h: 80, target: 'kew' }
      ],
      decorations: [
        { type: 'water', x: 0, y: 0, w: 1200, h: 100 },
        { type: 'crate', x: 250, y: 250 }, { type: 'crate', x: 290, y: 280 },
        { type: 'crate', x: 500, y: 350 }, { type: 'crate', x: 540, y: 380 },
        { type: 'crate', x: 750, y: 250 }, { type: 'crate', x: 950, y: 450 },
        { type: 'rubber_tree', x: 100, y: 500 }, { type: 'rubber_tree', x: 1100, y: 500 },
        { type: 'flag', x: 600, y: 250, color: '#a83838' }
      ],
      enemies: [
        { type: 'mosquito_swarm', behavior: 'flit', x: 600, y: 400 },
        { type: 'caiman', behavior: 'caiman', x: 900, y: 350, range: 100 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: "Wickham's Boasting Letter",
          x: 350, y: 350,
          passage: "In 1876, Henry Wickham collected approximately 70,000 seeds from Hevea brasiliensis trees in the Brazilian Amazon. He packed them in fast-drying baskets and loaded them on a steamship — declaring his cargo, by some accounts, as 'specimens of academical interest for the Royal Gardens.' Brazil had not yet banned the export of rubber seeds, but would soon. Whether Wickham broke a law or merely bent one, his shipment changed history. He himself called it 'one of the most successful acts of biopiracy in history' — taking pride in a word others might use as accusation.",
          questions: [{
            q: "How is Wickham's seed transfer described historically?",
            a: [
              'Universally as theft',
              'Universally as legitimate science',
              'As legally murky and ethically debated — sometimes called biopiracy, sometimes called scientific exchange',
              'As a small footnote'
            ],
            correct: 2,
            explain: 'Wickham himself sometimes used the word biopiracy with pride. Whether what he did was strictly illegal in 1876 is debated; what is not debated is that it dramatically reshaped the global rubber industry, and not in favor of Brazil.'
          }]
        }
      ],
      sparks: [
        { x: 500, y: 500, kind: 'sensory', text: 'Seventy thousand small seeds in woven baskets, steaming in the heat, ready to be carried across an ocean.' },
        { x: 900, y: 500, kind: 'prompt', text: 'When does taking a seed from one place and growing it in another become theft? When is it science? Where is the line — and who gets to draw it?' }
      ]
    },
    {
      id: 'kew',
      name: 'Kew Gardens Glasshouse',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      walls: [
        { x: 0, y: 100, w: 1100, h: 14 },
        { x: 0, y: 586, w: 1100, h: 14 },
        { x: 0, y: 100, w: 14, h: 500 },
        { x: 1086, y: 100, w: 14, h: 500 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'amazon' },
        { x: 1080, y: 320, w: 20, h: 80, target: 'malaya' }
      ],
      decorations: [
        { type: 'sapling', x: 250, y: 250 }, { type: 'sapling', x: 300, y: 250 }, { type: 'sapling', x: 350, y: 250 },
        { type: 'sapling', x: 250, y: 350 }, { type: 'sapling', x: 300, y: 350 }, { type: 'sapling', x: 350, y: 350 },
        { type: 'sapling', x: 250, y: 450 }, { type: 'sapling', x: 300, y: 450 }, { type: 'sapling', x: 350, y: 450 },
        { type: 'sapling', x: 600, y: 250 }, { type: 'sapling', x: 650, y: 250 }, { type: 'sapling', x: 700, y: 250 },
        { type: 'sapling', x: 600, y: 350 }, { type: 'sapling', x: 650, y: 350 }, { type: 'sapling', x: 700, y: 350 },
        { type: 'sapling', x: 600, y: 450 }, { type: 'sapling', x: 650, y: 450 }, { type: 'sapling', x: 700, y: 450 },
        { type: 'sapling', x: 850, y: 350 }, { type: 'sapling', x: 900, y: 350 }, { type: 'sapling', x: 950, y: 350 }
      ],
      enemies: [
        { type: 'victorian_gardener', behavior: 'patrol', x: 500, y: 350, range: 100 },
        { type: 'victorian_gardener', behavior: 'patrol', x: 800, y: 250, range: 80 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Kew Gardens Notice',
          x: 450, y: 250,
          passage: "Of Wickham's 70,000 seeds, only about 2,400 germinated — but that was enough. The seedlings were carefully grown in the giant glasshouses of the Royal Botanic Gardens at Kew, near London. From Kew, baby Hevea trees were shipped to Ceylon (Sri Lanka), then Singapore, then the Malay Peninsula. Within thirty years, Asian plantation rubber overtook Brazilian wild rubber. The Brazilian rubber economy collapsed. Whole towns built during the boom emptied out. The Olmec idea, on its long journey, was now flowering in entirely new soil.",
          questions: [{
            q: 'What was the consequence for Brazil of the seed transfer?',
            a: [
              'Brazil dominated the rubber industry for another century',
              'Brazil and the Amazon rubber boom collapsed within a few decades as Asian plantations took over',
              'Nothing changed economically',
              'Brazil and Britain shared the profits equally'
            ],
            correct: 1,
            explain: 'The Amazon rubber boom collapsed catastrophically. Cities like Manaus, which had become wealthy almost overnight, emptied just as quickly. The seed transfer fundamentally redistributed where the wealth of rubber would be made.'
          }]
        }
      ],
      sparks: [
        { x: 1000, y: 500, kind: 'sensory', text: 'Tens of thousands of identical seedlings in a Victorian glasshouse, glass humid with breath, soft sun overhead.' },
        { x: 200, y: 500, kind: 'fact', text: 'Joseph Hooker, the director of Kew, oversaw the project of moving useful plants between colonies of the British Empire — rubber, but also tea, cinchona, coffee. The empire moved plants like it moved people.' }
      ]
    },
    {
      id: 'malaya',
      name: 'Plantation in Malaya',
      width: 1200, height: 700,
      playerSpawn: { x: 60, y: 350 },
      isBossArea: true,
      bossSpawn: { x: 900, y: 350 },
      walls: [
        { x: 0, y: 0, w: 1200, h: 14 },
        { x: 0, y: 686, w: 1200, h: 14 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'kew' }
      ],
      decorations: [
        { type: 'rubber_tree', x: 200, y: 200 }, { type: 'rubber_tree', x: 350, y: 200 },
        { type: 'rubber_tree', x: 500, y: 200 }, { type: 'rubber_tree', x: 650, y: 200 },
        { type: 'rubber_tree', x: 200, y: 500 }, { type: 'rubber_tree', x: 350, y: 500 },
        { type: 'rubber_tree', x: 500, y: 500 }, { type: 'rubber_tree', x: 650, y: 500 },
        { type: 'rubber_tree', x: 1100, y: 500 }, { type: 'rubber_tree', x: 1100, y: 200 },
        { type: 'crate', x: 800, y: 250 }, { type: 'crate', x: 850, y: 280 }
      ],
      enemies: [],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Final Plaque',
          x: 350, y: 400,
          passage: "By 1910, plantation rubber from Malaya, Ceylon, and Indonesia dominated the world market. Plantation labor was often forced or indentured — workers brought from southern India, indigenous Malayan workers, and others laboring under conditions ranging from harsh to atrocious. In the Belgian Congo at the same time, the wild rubber trade involved violence on a horrific scale, with millions of African deaths attributed directly to the rubber economy. The Olmec idea was now everywhere — in tires, in tubes, in waterproof boots, in surgical gloves — and that everywhere was built, in part, on terrible suffering. The story of rubber is not a clean story. It never was.",
          questions: [{
            q: 'How was the global rubber industry of the late 1800s and early 1900s built?',
            a: [
              'Through fair trade between equal partners',
              'Largely through colonial systems involving forced labor, indentured workers, and in the Belgian Congo, atrocity-level violence',
              'Through volunteer labor',
              'Mostly with machines, not people'
            ],
            correct: 1,
            explain: "This is a difficult truth that should not be sanitized. The global rubber economy enabled bicycles, cars, and modern industry — but it was built on the labor and suffering of enormous numbers of people, often under colonial coercion. Both things are true at once."
          }]
        }
      ],
      sparks: [
        { x: 500, y: 600, kind: 'fact', text: "By 1920, the descendants of Wickham's 2,400 seedlings — and their cuttings — were producing more rubber annually than all the wild trees of the Amazon ever had." },
        { x: 1000, y: 500, kind: 'sensory', text: 'A neat row of identical trees, all the same age, all from the same shipment of seeds, planted ten thousand miles from home.' },
        { x: 700, y: 600, kind: 'prompt', text: 'How would you make an art piece about a single object whose journey carries both wonder and harm? What would the colors be? Where would you place the eye?' }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'Wickham asks: "Was what I did good or bad?"',
      a: [
        'Good — I advanced science and made rubber available to the world',
        'Bad — I was a thief who destroyed the Brazilian rubber economy',
        "Both — it was a turning point in global history that had real benefits and real costs",
        "Neither — it doesn't matter"
      ],
      correct: 2,
      explain: '"Yes," he says, the satisfaction draining a little from his face. "Both. It is uncomfortable to live in a both. But that is the honest answer."'
    },
    {
      q: "He asks: \"What does it mean that the Olmec idea is now everywhere — in every car, every shoe, every surgical glove?\"",
      a: [
        'It means the Olmec won, eventually',
        'It means the original makers were forgotten while their idea conquered the world',
        'It means rubber is no longer special',
        "It means many things at once: a triumph of an idea, a forgetting of its makers, and a long debt that was rarely repaid"
      ],
      correct: 3,
      explain: '"You are not afraid of complexity," he says. "Good. Hold it. Take it home. Make your art project out of it. The Olmec started this. Many hands carried it. Some of them carried it gently, and some of them did not. You decide what to do with that knowledge."'
    },
    {
      q: "Final question: \"What will your art project say?\"",
      reflective: true,
      a: [
        "I will tell the story of an idea that traveled across centuries",
        "I will show what was lost along the way as well as what was gained",
        "I will honor the original makers even when others got the credit",
        "All of these — and probably more I haven't thought of yet"
      ],
      correct: 3,
      explainOptions: [
        '"A traveling idea. Yes. Trace its path."',
        '"The losses make the gains visible. Show both."',
        '"Names matter. Faces matter. Hands matter."',
        '"Yes. Take all of it. The notebook is yours."'
      ]
    }
  ]
};
