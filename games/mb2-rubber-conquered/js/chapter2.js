// ============================================================
//  CHAPTER 2 — The Aztec Ballcourt (~1300 CE)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_2 = {
  num: 2,
  title: 'The Great Ballcourt',
  subtitle: 'Ulama — the game of the gods',
  era: '~1300 CE',
  location: 'Tenochtitlán, the Aztec capital',
  intro: "Centuries have passed. The Olmec are gone, but their invention lives on. You're now in Tenochtitlán, the Aztec capital, where the rubber ball has become the centerpiece of a fierce, sacred game played for over 3,000 years across Mesoamerica.",
  theme: 'ballcourt',
  bossName: 'Captain Ixtli',
  bossPortrait: 'aztec_ballplayer',
  bossRole: 'Ballcourt Champion',
  bossIntro: 'A muscled ballplayer in a thick yoke of carved wood blocks the path to the court. "Before you watch our game," he says, "tell me you understand it."',
  combatAllowed: true,
  subAreas: [
    {
      id: 'market',
      name: 'The Market District',
      width: 1200, height: 800,
      playerSpawn: { x: 80, y: 400 },
      walls: [
        { x: 200, y: 250, w: 100, h: 12 }, { x: 200, y: 250, w: 12, h: 100 },
        { x: 288, y: 250, w: 12, h: 100 },
        { x: 500, y: 500, w: 80, h: 12 }, { x: 500, y: 500, w: 12, h: 60 }, { x: 568, y: 500, w: 12, h: 60 },
        { x: 800, y: 200, w: 90, h: 12 }, { x: 800, y: 200, w: 12, h: 80 }, { x: 878, y: 200, w: 12, h: 80 }
      ],
      exits: [
        { x: 1180, y: 380, w: 20, h: 80, target: 'approach' }
      ],
      decorations: [
        { type: 'crate', x: 350, y: 350 }, { type: 'crate', x: 600, y: 280 },
        { type: 'crate', x: 950, y: 450 }, { type: 'crate', x: 250, y: 600 },
        { type: 'flag', x: 400, y: 400, color: '#3a4a8a' }, { type: 'flag', x: 750, y: 500, color: '#a83838' },
        { type: 'tree', x: 150, y: 700 }, { type: 'tree', x: 1100, y: 700 }
      ],
      enemies: [
        { type: 'rolling_ball', behavior: 'roll', axis: 'x', x: 600, y: 450, range: 200, speed: 2 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'amazon_villager',
          name: 'A Market Vendor',
          x: 320, y: 380,
          passage: 'Look around — rubber is everywhere if you know where to find it. We use it for waterproofing the soles of sandals, for binding tools, for sealing pots. The forest people far to the south send us their best balls in trade. The big ceremonial ones go to the priests; the smaller ones, children play with. Have you seen them bounce? It is like nothing else in the world.',
          questions: [{
            q: 'According to the vendor, which uses of rubber are mentioned in the market?',
            a: ['Only for ceremonial balls', 'Only for waterproof clothing', 'Many uses including waterproofing, binding, and sealing', 'Mainly for medicines'],
            correct: 2,
            explain: 'Rubber had many practical uses across Mesoamerica — waterproofing, sealing, binding — long before it had any of those uses in Europe. The ceremonial balls were just the most famous use.'
          }]
        }
      ],
      sparks: [
        { x: 700, y: 700, kind: 'fact', text: 'Aztec markets traded rubber by the strip — long ribbons of vulcanized latex wound around stone cores to make the heaviest balls.' },
        { x: 1000, y: 250, kind: 'sensory', text: 'The dull, leathery thump of a rubber ball striking a stone wall — heavy, certain, like a heartbeat.' }
      ]
    },
    {
      id: 'approach',
      name: 'Approach to the Ballcourt',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      walls: [
        { x: 400, y: 100, w: 30, h: 200 },
        { x: 400, y: 400, w: 30, h: 200 },
        { x: 700, y: 100, w: 30, h: 200 },
        { x: 700, y: 400, w: 30, h: 200 }
      ],
      exits: [
        { x: 0, y: 300, w: 14, h: 80, target: 'market' },
        { x: 1080, y: 320, w: 20, h: 80, target: 'court' }
      ],
      decorations: [
        { type: 'pillar', x: 200, y: 350 }, { type: 'pillar', x: 900, y: 350 },
        { type: 'flag', x: 500, y: 200, color: '#a83838' }, { type: 'flag', x: 600, y: 500, color: '#3a4a8a' }
      ],
      enemies: [
        { type: 'rolling_ball', behavior: 'roll', axis: 'y', x: 550, y: 350, range: 150, speed: 1.6 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Stela Beside the Path',
          x: 300, y: 300,
          passage: 'The ballgame is older than memory. Archaeologists have found ball courts dating back nearly 3,500 years — to the time of the Olmec. The game spread across all of Mesoamerica, played by Maya, Toltec, Mixtec, Zapotec, and Aztec peoples. Each region had its own variations, but always the same heavy rubber ball, the same stone-walled alley, the same understanding that this was no ordinary sport. The ball was the sun, traveling between worlds.',
          questions: [{
            q: 'What did the rubber ball symbolize in the ballgame?',
            a: ['The moon and stars', 'The sun and its journey between worlds', "A warrior's honor", 'The harvest'],
            correct: 1,
            explain: "The ball stood for the sun — its constant motion mirrored the sun's daily and yearly journeys. To keep the ball in motion was to participate in the cosmos itself."
          }]
        }
      ],
      sparks: [
        { x: 500, y: 600, kind: 'prompt', text: 'How would you draw a sport that is also a prayer? What changes in the picture?' }
      ]
    },
    {
      id: 'court',
      name: 'The Great Ballcourt',
      width: 1200, height: 700,
      playerSpawn: { x: 60, y: 350 },
      isBossArea: true,
      bossSpawn: { x: 850, y: 350 },
      walls: [
        { x: 0, y: 80, w: 1200, h: 60 },
        { x: 0, y: 560, w: 1200, h: 60 }
      ],
      exits: [
        { x: 0, y: 300, w: 14, h: 80, target: 'approach' }
      ],
      decorations: [
        { type: 'ballhoop', x: 600, y: 140 },
        { type: 'ballhoop', x: 600, y: 620 },
        { type: 'pillar', x: 100, y: 300 }, { type: 'pillar', x: 1100, y: 300 }
      ],
      enemies: [
        { type: 'rolling_ball', behavior: 'roll', axis: 'x', x: 600, y: 350, range: 350, speed: 2.4 },
        { type: 'rolling_ball', behavior: 'roll', axis: 'x', x: 400, y: 250, range: 250, speed: 1.8 },
        { type: 'rolling_ball', behavior: 'roll', axis: 'x', x: 500, y: 450, range: 250, speed: 2.1 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'aztec_ballplayer',
          name: 'A Ballplayer',
          x: 300, y: 350,
          passage: 'The ball is solid rubber, three or four kilos in weight. We strike it only with our hips — never hands or feet. Without our yokes of wood and stone we would be broken. To pass it through the stone hoop on the wall ends the game instantly — but it is so rare that some courts go their whole history without it. When it happens, the spectators flee, because by tradition the winners may take their clothes and ornaments.',
          questions: [{
            q: 'Why do players wear thick yokes around their waists?',
            a: ['To look more impressive', 'Because the rubber ball is heavy enough to break bones', 'It is a religious requirement', 'To carry tools'],
            correct: 1,
            explain: 'A 3–4 kg solid rubber ball traveling fast can break ribs or worse. The yoke spread the impact and let players hit the ball back without injury.'
          }]
        }
      ],
      sparks: [
        { x: 700, y: 200, kind: 'fact', text: 'In some versions of the game, putting the ball through the stone hoop ended the match instantly — but it was so hard that whole generations of players never saw it happen.' },
        { x: 350, y: 500, kind: 'sensory', text: 'The court echoes — your own footsteps come back to you doubled. The walls listen.' }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'Captain Ixtli asks: "Why is this called more than a game?"',
      a: ['Because winners get rich', 'Because it carries religious meaning, with the ball symbolizing the sun', 'Because it lasts many days', 'Because the rules are very complicated'],
      correct: 1,
      explain: '"You see it," he says, satisfied. "We are not just playing. We are keeping the sun in motion."'
    },
    {
      q: 'He continues: "How is the ball struck?"',
      a: ['With wooden bats', 'With the hands', 'With the hips and torso, never hands or feet', 'With the head'],
      correct: 2,
      explain: '"The body remembers what the hands cannot," he says, tapping his thick wooden yoke.'
    },
    {
      q: 'Last question: "How long has this game been played in Mesoamerica?"',
      a: ['About 100 years', 'About 500 years', 'About 1,000 years', 'Over 3,000 years'],
      correct: 3,
      explain: "\"Older than my grandmother's grandmother's grandmother,\" he says. \"Older than memory itself.\""
    }
  ]
};
