// ============================================================
//  CHAPTER 3 — The Caribbean Coast (1490s)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_3 = {
  num: 3,
  title: 'A New World, a New Wonder',
  subtitle: 'Columbus meets the bouncing ball',
  era: '1493–1496',
  location: 'Hispaniola',
  intro: 'A different shore. The year is 1493. Christopher Columbus has just returned to the island he calls Hispaniola — what we call Haiti and the Dominican Republic. The Taíno people who live here greet his crew with food, with curiosity, and — strangest of all to Spanish eyes — with bouncing rubber balls.',
  theme: 'caribbean_coast',
  bossName: 'Christopher Columbus',
  bossPortrait: 'columbus',
  bossRole: 'Admiral of the Ocean Sea',
  bossIntro: 'A weathered Genoese sea captain stands on the beach with a rubber ball in his hand, turning it over and over. He looks up at you. "I must explain this thing to my queen. Help me."',
  combatAllowed: true,
  subAreas: [
    {
      id: 'beach',
      name: 'The Beach Landing',
      width: 1200, height: 700,
      playerSpawn: { x: 80, y: 350 },
      walls: [],
      exits: [
        { x: 1180, y: 320, w: 20, h: 80, target: 'village' }
      ],
      decorations: [
        { type: 'sand', x: 0, y: 480, w: 1200, h: 220 },
        { type: 'water', x: 0, y: 540, w: 1200, h: 160 },
        { type: 'palm', x: 200, y: 200 }, { type: 'palm', x: 500, y: 180 },
        { type: 'palm', x: 850, y: 220 }, { type: 'palm', x: 1100, y: 240 },
        { type: 'crate', x: 350, y: 420 }, { type: 'crate', x: 380, y: 410 },
        { type: 'flag', x: 600, y: 420, color: '#a83838' }
      ],
      enemies: [
        { type: 'sand_crab', behavior: 'wander', x: 500, y: 450 },
        { type: 'sand_crab', behavior: 'wander', x: 800, y: 460 },
        { type: 'mosquito_swarm', behavior: 'flit', x: 700, y: 250 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: "A Spanish Crewman's Notebook",
          x: 350, y: 320,
          passage: "Today the natives brought us a marvelous thing — a ball of some dark substance that, when dropped, leaps up again as if alive. None of us has seen anything like it. Our balls in Spain are leather stuffed with hair, or pig's bladders blown full of air. They do not jump as this one does. The captain says he will take one back to the queen. He cannot find a word in Spanish to describe what it does.",
          questions: [{
            q: 'Why did the Spanish crewman struggle to describe the rubber ball?',
            a: ['It was too dangerous', 'No European material existed that bounced like it', 'It was held secret', 'He could not see it clearly'],
            correct: 1,
            explain: 'Europe truly had no equivalent. Spanish balls were leather stuffed with hair, or inflated bladders. Neither bounced. The crewman literally lacked words for the experience.'
          }]
        }
      ],
      sparks: [
        { x: 600, y: 350, kind: 'sensory', text: 'A strange dark ball lying in white sand, leaping when dropped — sand sticking to it.' },
        { x: 1000, y: 400, kind: 'fact', text: 'The Taíno word for the substance was something like "cau-uchu" — the origin of the French word "caoutchouc," still used in much of the world today.' }
      ]
    },
    {
      id: 'village',
      name: 'A Taíno Village',
      width: 1200, height: 800,
      playerSpawn: { x: 60, y: 400 },
      walls: [
        { x: 250, y: 250, w: 80, h: 12 }, { x: 250, y: 250, w: 12, h: 70 }, { x: 318, y: 250, w: 12, h: 70 },
        { x: 600, y: 200, w: 80, h: 12 }, { x: 600, y: 200, w: 12, h: 70 }, { x: 668, y: 200, w: 12, h: 70 },
        { x: 850, y: 480, w: 80, h: 12 }, { x: 850, y: 480, w: 12, h: 70 }, { x: 918, y: 480, w: 12, h: 70 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'beach' },
        { x: 1180, y: 380, w: 20, h: 80, target: 'camp' }
      ],
      decorations: [
        { type: 'palm', x: 150, y: 250 }, { type: 'palm', x: 1050, y: 600 },
        { type: 'fire', x: 500, y: 500 },
        { type: 'plant', x: 300, y: 600 }, { type: 'plant', x: 800, y: 200 },
        { type: 'tree', x: 200, y: 700 }, { type: 'tree', x: 1100, y: 200 }
      ],
      enemies: [
        { type: 'mosquito_swarm', behavior: 'flit', x: 500, y: 350 },
        { type: 'mosquito_swarm', behavior: 'flit', x: 900, y: 400 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'taino_child',
          name: 'A Taíno Child',
          x: 450, y: 450,
          passage: 'I throw it to you — catch! See, it comes back? My grandmother taught me. We have many balls. Some big, some small. The big ones are for the courtyard game when the elders play. The small ones are for us. The Spanish men watch us throw them and they laugh, but it is a strange laugh, not happy. They have never seen this before. How can that be?',
          questions: [{
            q: "How does the child react to the Spaniards' surprise?",
            a: ['She is afraid of them', 'She is confused that something so ordinary to her is amazing to them', 'She refuses to play with them', 'She tries to sell them a ball'],
            correct: 1,
            explain: 'For the Taíno, rubber was an everyday material. For Europeans, it was a wonder. The same object meant entirely different things to different people — a recurring theme in this whole story.'
          }]
        },
        {
          type: 'plaque',
          name: 'An Inscription on a Wooden Post',
          x: 750, y: 400,
          passage: 'The Taíno were the first people of the Americas to encounter Europeans. Their numbers, possibly several million on Hispaniola alone, would collapse within decades — through disease, forced labor, and violence. The Spanish would call this "the encounter," but it was the beginning of the end of the Taíno world. The bouncing ball Columbus packed up and brought to Spain was made by people whose civilization was about to be erased.',
          questions: [{
            q: 'What happened to the Taíno population in the decades after Columbus arrived?',
            a: ['They migrated to other islands', 'They were largely destroyed by disease, forced labor, and violence', 'They merged peacefully with the Spanish', 'They moved to Mexico'],
            correct: 1,
            explain: 'The Taíno population collapsed catastrophically. Disease alone killed enormous numbers; the encomienda system added forced labor; violence took the rest. By the mid-1500s, the Taíno world as it had been was gone.'
          }]
        }
      ],
      sparks: [
        { x: 600, y: 700, kind: 'sensory', text: 'A circle of children laughing, a ball passing hand to hand to hand, while strangers in armor watch.' },
        { x: 1000, y: 700, kind: 'prompt', text: 'How do you draw something that is ordinary to one person and a wonder to another, in the same image?' }
      ]
    },
    {
      id: 'camp',
      name: 'Spanish Camp at La Navidad',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      isBossArea: true,
      bossSpawn: { x: 850, y: 350 },
      walls: [
        { x: 200, y: 200, w: 200, h: 14 }, { x: 200, y: 200, w: 14, h: 200 },
        { x: 386, y: 200, w: 14, h: 80 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'village' }
      ],
      decorations: [
        { type: 'crate', x: 280, y: 280 }, { type: 'crate', x: 320, y: 320 },
        { type: 'flag', x: 500, y: 250, color: '#a83838' },
        { type: 'fire', x: 600, y: 500 },
        { type: 'palm', x: 150, y: 600 }, { type: 'palm', x: 1000, y: 200 },
        { type: 'water', x: 0, y: 580, w: 1100, h: 120 }
      ],
      enemies: [
        { type: 'sand_crab', behavior: 'wander', x: 700, y: 480 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Letter Being Drafted',
          x: 350, y: 400,
          passage: "In his letter to the Spanish crown, Columbus described many wonders of these islands: gold, parrots, plants no European had named. Among these — almost as an afterthought — he mentioned the bouncing balls. \"They have certain balls of substance that I cannot describe, which leap in a way our balls do not.\" Most readers in Europe focused on the gold. The balls were strange, but were they useful? Could they be sold? No one in Spain could yet imagine why they would matter.",
          questions: [{
            q: "How was the rubber ball received in Europe by most readers of Columbus's letter?",
            a: ['As the most exciting discovery from the voyage', 'As a curious oddity overshadowed by interest in gold', 'As a religious symbol', 'As a useful new tool'],
            correct: 1,
            explain: 'Europeans were obsessed with what they could exploit economically. Gold could be spent. Spices could be traded. A bouncing ball had no obvious use — and so it was filed away as a curiosity for almost two more centuries.'
          }]
        }
      ],
      sparks: [
        { x: 200, y: 600, kind: 'fact', text: 'When Columbus left for Spain, he left 39 men behind on Hispaniola. By the time he returned, all of them were dead — the colony had collapsed in conflict.' },
        { x: 950, y: 400, kind: 'sensory', text: 'A wooden table with maps, a quill, and a single rubber ball sitting on top of a half-finished letter to the queen.' }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'Columbus asks: "How shall I describe this ball to people who have never seen rubber? What is the most useful comparison?"',
      a: ['Compare it to a bird, since it leaps', 'Compare its bounce to nothing in Europe — admit the comparison fails', 'Tell them it is magical and refuse to explain', 'Lie and say it is just a leather ball'],
      correct: 1,
      explain: "He nods. \"Yes. Sometimes the honest answer is: 'I have nothing to compare it to.' That is itself information.\""
    },
    {
      q: 'He asks: "Why do you think Europe will not, for many years, find a use for this thing?"',
      a: ['Because Europeans are not clever', 'Because there is no industry, no science yet, that knows what to do with a stretchy material', 'Because it has been outlawed', 'Because it is too expensive'],
      correct: 1,
      explain: '"True," he says. "A new thing arrives and the old world has no place for it. Maybe in a hundred years. Maybe in three hundred. We sailors only carry what we find."'
    }
  ]
};
