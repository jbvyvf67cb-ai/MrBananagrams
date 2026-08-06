// ============================================================
//  CHAPTER 7 — La Condamine on the Amazon (1735-1744)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_7 = {
  num: 7,
  title: 'The Amazon',
  subtitle: 'A French scientist takes notes',
  era: '1735–1744',
  location: 'The Amazon Basin',
  intro: "Two centuries pass. Then in 1735, a French expedition arrives in South America to measure the curve of the Earth at the equator. One of its scientists — Charles-Marie de La Condamine — notices something the Spanish never bothered to notice: the local people are using rubber for everything. Boots. Bottles. Torches. Syringes. He writes it all down. He sends samples to Paris. This time, somebody is listening.",
  theme: 'amazon_river',
  bossName: 'Charles-Marie de La Condamine',
  bossPortrait: 'la_condamine',
  bossRole: 'French naturalist and geographer',
  bossIntro: 'A wiry, sun-burnt European in muddy boots is making notes in a leather notebook by a riverbank. He looks up over wire-rimmed glasses. "Ah, a fellow traveler. Tell me — why do you think my samples will land differently in Paris than the ones Columbus brought to Spain?"',
  combatAllowed: true,
  subAreas: [
    {
      id: 'riverbank',
      name: 'The Amazon Riverbank',
      width: 1200, height: 800,
      playerSpawn: { x: 80, y: 400 },
      walls: [],
      exits: [
        { x: 1180, y: 380, w: 20, h: 80, target: 'village' }
      ],
      decorations: [
        { type: 'water', x: 0, y: 580, w: 1200, h: 220 },
        { type: 'rubber_tree', x: 200, y: 250 }, { type: 'rubber_tree', x: 400, y: 200 },
        { type: 'rubber_tree', x: 700, y: 280 }, { type: 'rubber_tree', x: 950, y: 220 },
        { type: 'rubber_tree', x: 1100, y: 340 },
        { type: 'plant', x: 300, y: 450 }, { type: 'plant', x: 600, y: 500 },
        { type: 'plant', x: 850, y: 480 }
      ],
      enemies: [
        { type: 'caiman', behavior: 'caiman', x: 600, y: 600, range: 100 },
        { type: 'mosquito_swarm', behavior: 'flit', x: 400, y: 350 },
        { type: 'mosquito_swarm', behavior: 'flit', x: 900, y: 400 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'La Condamine\'s Field Notes',
          x: 350, y: 320,
          passage: "I have observed the natives here using a substance they call 'caoutchouc,' from a tree that weeps a milky sap. They dip their feet in this sap; when it dries, they have a perfect waterproof shoe. They paint cloth with it and make rain capes. They form it into bottles for liquids, into tubes that work as syringes, and into torches that burn slowly. Most curious of all: they shape it into balls that bounce in a way I cannot easily explain to my colleagues at the Academy.",
          questions: [{
            q: 'According to La Condamine\'s notes, what did Amazon peoples make from rubber?',
            a: ['Only ceremonial balls', 'Only weapons', 'Waterproof footwear, cloth, bottles, syringes, torches, and balls', 'Mostly statues'],
            correct: 2,
            explain: 'La Condamine documented an enormous range of practical uses. The Amazonian peoples had developed a working rubber technology that European industry would not match for over a hundred years.'
          }]
        }
      ],
      sparks: [
        { x: 600, y: 350, kind: 'sensory', text: 'A man dipping his feet into liquid latex, holding them up by the fire, watching the milk darken into shoes.' },
        { x: 1000, y: 750, kind: 'fact', text: "The word 'caoutchouc' is still the standard word for rubber in French and many other languages. It comes from the Tupi 'cao-tchu,' meaning 'weeping wood.'" }
      ]
    },
    {
      id: 'village',
      name: 'An Indigenous Village',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      walls: [
        { x: 200, y: 200, w: 80, h: 14 }, { x: 200, y: 200, w: 14, h: 80 }, { x: 268, y: 200, w: 14, h: 80 },
        { x: 600, y: 450, w: 80, h: 14 }, { x: 600, y: 450, w: 14, h: 80 }, { x: 668, y: 450, w: 14, h: 80 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'riverbank' },
        { x: 1080, y: 320, w: 20, h: 80, target: 'boat' }
      ],
      decorations: [
        { type: 'fire', x: 400, y: 300 }, { type: 'fire', x: 800, y: 250 },
        { type: 'plant', x: 200, y: 500 }, { type: 'plant', x: 500, y: 600 },
        { type: 'plant', x: 900, y: 500 },
        { type: 'rubber_tree', x: 100, y: 200 }, { type: 'rubber_tree', x: 1000, y: 600 }
      ],
      enemies: [
        { type: 'caiman', behavior: 'caiman', x: 700, y: 350, range: 150 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'amazon_villager',
          name: 'A Village Elder',
          x: 320, y: 400,
          passage: "We have used the milk of the tree forever. The Frenchman watches us and writes things down. He asks how we make the boots, the bottles, the bouncing balls. We tell him because he is curious in a careful way — not greedy, not afraid. We do not yet know that what he writes will travel further than he does. The trees have been giving their milk for as long as we can remember, and they will keep giving as long as we do not take too much.",
          questions: [{
            q: "Why does the elder distinguish La Condamine's curiosity from earlier European interest?",
            a: ['He is French, not Spanish', 'He is curious in a careful way — neither greedy nor afraid — which earns trust', 'He pays better', 'He is younger'],
            correct: 1,
            explain: "Different European visitors carried different intentions. La Condamine came as a scientist. The locals' willingness to share with him reflected the way he listened. Trust shapes what knowledge travels."
          }]
        }
      ],
      sparks: [
        { x: 500, y: 600, kind: 'fact', text: 'Indigenous Amazonians had been using rubber tubes as effective syringes — for medicine, body paint, and games — long before any European had a syringe.' },
        { x: 850, y: 500, kind: 'prompt', text: 'When does sharing knowledge feel safe? When does it feel risky? What changes for the person sharing?' }
      ]
    },
    {
      id: 'boat',
      name: 'On the Boat to Paris',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      isBossArea: true,
      bossSpawn: { x: 800, y: 350 },
      walls: [
        { x: 0, y: 100, w: 1100, h: 14 },
        { x: 0, y: 586, w: 1100, h: 14 },
        { x: 0, y: 100, w: 14, h: 500 },
        { x: 1086, y: 100, w: 14, h: 500 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'village' }
      ],
      decorations: [
        { type: 'crate', x: 250, y: 250 }, { type: 'crate', x: 280, y: 280 },
        { type: 'crate', x: 500, y: 450 }, { type: 'crate', x: 700, y: 200 },
        { type: 'flag', x: 950, y: 200, color: '#3a4a8a' },
        { type: 'water', x: 0, y: 0, w: 1100, h: 100 },
        { type: 'water', x: 0, y: 600, w: 1100, h: 100 }
      ],
      enemies: [],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Letter to the Paris Academy',
          x: 350, y: 350,
          passage: "In 1736, La Condamine sent rubber samples and his notes to the Paris Academy of Sciences. By the 1750s, French scientists were experimenting. By the 1770s, in England, Joseph Priestley had used a piece of the substance to rub out pencil marks and called it 'rubber' — the name we still use. Slowly, slowly, European industry started to find uses: rubberized cloth, surgical instruments. Vulcanization in the modern sense would still take another seventy years. But the door was finally open.",
          questions: [{
            q: 'What changed between Columbus\'s ball in 1493 and La Condamine\'s samples in 1736?',
            a: ['Nothing significant changed', 'Europe now had scientific academies, journals, and industries that could receive and develop a discovery', 'Rubber became more valuable', 'The trees were larger'],
            correct: 1,
            explain: "The bottleneck had never been the rubber. It was Europe's ability to receive an idea. By 1736, scientific institutions, journals, and the early industrial revolution were ready. The same sample, sent in 1493, would have done nothing. Sent in 1736, it started a chain reaction."
          }]
        }
      ],
      sparks: [
        { x: 600, y: 500, kind: 'sensory', text: 'A glass jar of dark rubber sap, sealed with wax, riding in the cargo hold of a wooden ship across an ocean.' },
        { x: 900, y: 500, kind: 'fact', text: "Joseph Priestley, the British chemist, named the substance 'rubber' because he used a small piece of it to rub out pencil mistakes. The name stuck. Most of the rest of the world still calls it caoutchouc." }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'La Condamine asks: "Why do my samples land differently than Columbus\'s did?"',
      a: [
        'They are bigger samples',
        "Europe in 1736 has scientific academies and emerging industry that can actually use them — Columbus's Europe could not",
        'The ship is faster',
        'The French are smarter than the Spanish'
      ],
      correct: 1,
      explain: '"Yes," he says, smiling. "I am no cleverer than the friars who wrote the recipe down. But I write into a world that is finally ready to read."'
    },
    {
      q: 'He asks: "What did the Amazon peoples already know that European industry would have to learn slowly?"',
      a: [
        'How to mix latex with morning glory or other vulcanizing agents',
        'How to make practical waterproof goods, syringes, and tubes',
        'How to balance harvest so the trees keep producing',
        'All of these'
      ],
      correct: 3,
      explain: '"All of it," he says. "I am writing down what other people have known for generations. That is most of science, when we are honest about it."'
    }
  ]
};
