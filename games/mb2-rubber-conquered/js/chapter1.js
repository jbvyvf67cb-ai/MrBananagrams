// ============================================================
//  CHAPTER 1 — Olmec Heartland (~1500 BCE)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_1 = {
  num: 1,
  title: 'Olmec Heartland',
  subtitle: 'Where the rubber people lived',
  era: '~1500 BCE',
  location: 'Gulf Coast of Mexico',
  intro: "You arrive on a humid morning along Mexico's Gulf Coast. The air smells of damp leaves and woodsmoke. The Olmec — the people who will one day be called 'the rubber people' — are tapping trees and shaping their first balls. There is a story here about how an idea begins.",
  theme: 'rainforest_dawn',
  bossName: 'The Olmec Elder',
  bossPortrait: 'olmec_elder',
  bossRole: 'Keeper of the Rubber Tradition',
  bossIntro: 'An elder sits cross-legged before a wooden bowl of pale latex. She watches you approach. "You have walked far," she says. "Tell me what you have learned, and you may pass."',
  combatAllowed: true,
  subAreas: [
    {
      id: 'village',
      name: 'Olmec Village',
      width: 1200, height: 800,
      playerSpawn: { x: 80, y: 400 },
      walls: [
        { x: 200, y: 200, w: 60, h: 12 },
        { x: 200, y: 200, w: 12, h: 80 },
        { x: 248, y: 200, w: 12, h: 80 },
        { x: 600, y: 500, w: 80, h: 12 },
        { x: 600, y: 500, w: 12, h: 80 },
        { x: 668, y: 500, w: 12, h: 80 }
      ],
      exits: [
        { x: 1180, y: 380, w: 20, h: 80, target: 'grove' }
      ],
      decorations: [
        { type: 'tree', x: 100, y: 200 }, { type: 'tree', x: 350, y: 150 },
        { type: 'tree', x: 700, y: 200 }, { type: 'tree', x: 950, y: 250 },
        { type: 'tree', x: 1100, y: 600 },{ type: 'tree', x: 80, y: 700 },
        { type: 'tree', x: 480, y: 700 }, { type: 'tree', x: 800, y: 720 },
        { type: 'fire', x: 400, y: 400 },
        { type: 'rock', x: 540, y: 320 }, { type: 'rock', x: 880, y: 480, w: 18, h: 12 }
      ],
      enemies: [
        { type: 'tapir', behavior: 'wander', x: 500, y: 250 },
        { type: 'tapir', behavior: 'wander', x: 750, y: 600 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'olmec_tapper',
          name: 'A Rubber Tapper',
          x: 320, y: 420,
          passage: 'I cut a spiral groove in the bark of the Castilla tree and the white sap drips into my bowl. We call this milk of the tree. Alone it is sticky and useless — it dries hard and brittle in the sun. But mixed with the juice of the morning glory vine, it becomes something different: stretchy, bouncy, alive. We have made this for as long as anyone remembers.',
          questions: [{
            q: 'What does the tapper mix with the latex to transform it?',
            a: ['Salt water', 'Morning glory vine juice', 'Powdered ash', 'Tree bark'],
            correct: 1,
            explain: 'The Olmec mixed latex with juice from morning glory vines (Ipomoea alba). The mixture cross-linked the rubber molecules, making the material strong and bouncy — a kind of vulcanization 3,000 years before Charles Goodyear.'
          }]
        },
        {
          type: 'plaque',
          name: 'A Stone Glyph',
          x: 700, y: 400,
          passage: "The people the Aztecs would later call 'Olmec' — meaning 'rubber people' in the Nahuatl language — lived along this Gulf Coast from around 1500 BCE. They are sometimes called the mother culture of Mesoamerica. They built the earliest known cities of the region, carved colossal stone heads, and discovered how to turn the sap of the rubber tree into something the rest of the world had never seen.",
          questions: [{
            q: 'What does the name "Olmec" mean in Nahuatl?',
            a: ['River people', 'Rubber people', 'Sun people', 'Stone people'],
            correct: 1,
            explain: 'The name "Olmec" was given to them later by the Aztecs and means "rubber people" — recognition that this was the culture rubber-making came from.'
          }]
        }
      ],
      sparks: [
        { x: 500, y: 700, kind: 'sensory', text: 'The smell of morning glory juice and tree sap mixing together — sharp, green, alive.' },
        { x: 1050, y: 200, kind: 'fact', text: 'The Olmec carved colossal stone heads — some over 3 meters tall — from a single boulder of basalt.' }
      ]
    },
    {
      id: 'grove',
      name: 'The Rubber Grove',
      width: 1200, height: 700,
      playerSpawn: { x: 60, y: 350 },
      walls: [],
      exits: [
        { x: 0, y: 300, w: 14, h: 80, target: 'village' },
        { x: 1180, y: 320, w: 20, h: 80, target: 'bog' }
      ],
      decorations: [
        { type: 'rubber_tree', x: 200, y: 250 }, { type: 'rubber_tree', x: 380, y: 180 },
        { type: 'rubber_tree', x: 580, y: 320 }, { type: 'rubber_tree', x: 780, y: 220 },
        { type: 'rubber_tree', x: 950, y: 380 }, { type: 'rubber_tree', x: 300, y: 480 },
        { type: 'rubber_tree', x: 700, y: 540 }, { type: 'rubber_tree', x: 1050, y: 200 },
        { type: 'plant', x: 150, y: 500 }, { type: 'plant', x: 600, y: 600 },
        { type: 'plant', x: 900, y: 580 }, { type: 'plant', x: 250, y: 380 }
      ],
      enemies: [
        { type: 'jaguar', behavior: 'jaguar', x: 600, y: 350, range: 200 },
        { type: 'tapir', behavior: 'wander', x: 850, y: 500 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Carving on a Rubber Tree',
          x: 480, y: 300,
          passage: 'The tree we tap is Castilla elastica, native to the lowland forests of southern Mexico and Central America. It grows tall and straight in the warm, wet places near the coast. A spiral cut releases the latex; a careful tapper can return to the same tree for many years. The latex must be processed quickly. Left alone, it darkens, hardens, and loses its life.',
          questions: [{
            q: 'Why must the latex be processed quickly after tapping?',
            a: ['It poisons whoever waits', 'It darkens and hardens, losing its useful properties', 'It attracts dangerous animals', 'It evaporates within minutes'],
            correct: 1,
            explain: "Latex is unstable in air. Without quick processing — including the morning glory step — it stiffens and cracks. The tapper's skill includes knowing the timing."
          }]
        }
      ],
      sparks: [
        { x: 400, y: 600, kind: 'fact', text: 'Castilla elastica trees can be tapped for years without harm if the cuts are spaced and shallow — the tapper plans for the long term.' },
        { x: 900, y: 240, kind: 'sensory', text: 'White milk dripping into a wooden bowl, slow as honey, faintly sweet.' },
        { x: 1100, y: 540, kind: 'prompt', text: 'What color would you paint the moment when liquid sap becomes solid rubber? Is it a single color, or a gradient?' }
      ]
    },
    {
      id: 'bog',
      name: 'The Sacred Bog at El Manatí',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      isBossArea: true,
      bossSpawn: { x: 800, y: 350 },
      walls: [],
      exits: [
        { x: 0, y: 300, w: 14, h: 80, target: 'grove' }
      ],
      decorations: [
        { type: 'water', x: 100, y: 480, w: 900, h: 180 },
        { type: 'rock', x: 280, y: 220 }, { type: 'rock', x: 500, y: 180 },
        { type: 'rock', x: 750, y: 250 }, { type: 'tree', x: 150, y: 200 },
        { type: 'tree', x: 950, y: 180 }
      ],
      enemies: [
        { type: 'jaguar', behavior: 'jaguar', x: 400, y: 300, range: 180 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: "A Carved Stone at the Bog's Edge",
          x: 350, y: 250,
          passage: 'In the year 1989, archaeologists working in this very bog found something extraordinary: a dozen rubber balls preserved in the wet, oxygen-poor mud for nearly 3,500 years. The balls ranged from the size of a tennis ball to the size of a basketball. They had been left here as offerings — sacred objects, given back to the earth. This is the earliest direct evidence of rubber use anywhere in the world.',
          questions: [{
            q: 'Why were ancient rubber balls preserved at El Manatí?',
            a: ['They were sealed in stone vaults', 'The wet, oxygen-poor mud kept them from rotting', 'They were treated with special chemicals', 'They were copies made in modern times'],
            correct: 1,
            explain: 'Waterlogged, low-oxygen environments protect organic materials from decay. The balls survived because the bog itself was an excellent preserver — a happy accident for archaeology.'
          }]
        }
      ],
      sparks: [
        { x: 200, y: 600, kind: 'sensory', text: 'A rubber ball, dark and wet, lifted from black mud after sleeping there for 3,500 years.' },
        { x: 600, y: 600, kind: 'prompt', text: 'If you were giving an offering to the earth, what would you choose? Why?' }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'The elder asks: "What did the morning glory juice do to the latex?"',
      a: ['Made it sweet to taste', 'Made it cross-link so it became strong and bouncy', 'Made it dry faster only', 'Made it change color'],
      correct: 1,
      explain: '"Yes," she nods. "Without it, the latex is brittle. With it, the ball lives in the air."'
    },
    {
      q: 'She asks again: "And what does this place — El Manatí — tell us about how we used the rubber?"',
      a: ['It was used only for play', 'It had sacred and ceremonial meaning, not just practical use', 'It was a secret no one was allowed to share', 'It was traded for gold'],
      correct: 1,
      explain: '"The ball belongs to the earth as well as to us," she says. "We give it back, and it remembers."'
    }
  ]
};
