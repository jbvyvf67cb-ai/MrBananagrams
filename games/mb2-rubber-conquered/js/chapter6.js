// ============================================================
//  CHAPTER 6 — The Chroniclers' Library (1550-1590)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_6 = {
  num: 6,
  title: "The Chroniclers' Library",
  subtitle: 'Where the recipe was written down, and ignored',
  era: '1550–1590',
  location: 'Spanish Mexico and Spain',
  intro: 'The court has moved on. But in the quiet corners of monasteries, Spanish friars are spending their lives writing down what the Aztec world knew before it ended. Some of them wrote, in plain ink, exactly how to make rubber. The books were finished. They were filed. And then almost nobody read them for two hundred and fifty years.',
  theme: 'monastery_library',
  bossName: 'Friar Diego Durán',
  bossPortrait: 'friar_duran',
  bossRole: 'Dominican friar, chronicler',
  bossIntro: 'A thin man in a dark robe sits at a table covered in parchment. A single candle burns. He looks up. "Tell me, traveler, why writing something down is not always the same as it being known."',
  combatAllowed: true,
  subAreas: [
    {
      id: 'cloister',
      name: 'Cloister Garden',
      width: 1100, height: 700,
      playerSpawn: { x: 80, y: 350 },
      walls: [
        { x: 200, y: 100, w: 14, h: 500 },
        { x: 200, y: 100, w: 700, h: 14 },
        { x: 200, y: 586, w: 700, h: 14 },
        { x: 900, y: 100, w: 14, h: 200 },
        { x: 900, y: 400, w: 14, h: 200 }
      ],
      exits: [
        { x: 900, y: 320, w: 30, h: 80, target: 'scriptorium' }
      ],
      decorations: [
        { type: 'tree', x: 400, y: 250 }, { type: 'tree', x: 600, y: 350 },
        { type: 'plant', x: 500, y: 450 }, { type: 'plant', x: 700, y: 250 },
        { type: 'pillar', x: 250, y: 200 }, { type: 'pillar', x: 250, y: 500 },
        { type: 'pillar', x: 850, y: 200 }, { type: 'pillar', x: 850, y: 500 }
      ],
      enemies: [
        { type: 'bat', behavior: 'flit', x: 500, y: 200 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'scribe',
          name: 'A Young Scribe',
          x: 350, y: 350,
          passage: "I am one of the indigenous students working with Friar Sahagún. He calls our project the Florentine Codex. We write everything we can remember about how things were before the Spanish came — the gods, the medicines, the festivals, the rubber, the foods. He writes in Spanish; we write in our own Nahuatl. Both languages on the same page, side by side. Some of us are descended from people who actually made rubber for the temples. We know the recipe. We are putting it down.",
          questions: [{
            q: 'Why is the Florentine Codex unusual among Spanish-era documents?',
            a: ['It was the first book printed in the Americas', 'It was written collaboratively in Spanish and Nahuatl, with indigenous scholars as co-authors', 'It was banned by the Pope', 'It contains only drawings'],
            correct: 1,
            explain: 'The Florentine Codex is one of the rare documents of the era written by indigenous scholars in their own language alongside the Spanish text. It is partly a Spanish chronicle and partly the voice of the Nahua scholars themselves.'
          }]
        }
      ],
      sparks: [
        { x: 700, y: 450, kind: 'sensory', text: 'A library where the only sound is the scratch of quill on parchment, and dust falling.' },
        { x: 500, y: 600, kind: 'fact', text: 'Bernardino de Sahagún spent over fifty years in Mexico writing about indigenous life. His co-authors — Nahua noblemen — are usually not named in the books. We know some of them only as initials.' }
      ]
    },
    {
      id: 'scriptorium',
      name: 'The Scriptorium',
      width: 1200, height: 700,
      playerSpawn: { x: 60, y: 350 },
      walls: [
        { x: 300, y: 100, w: 14, h: 200 },
        { x: 300, y: 400, w: 14, h: 200 },
        { x: 700, y: 0, w: 14, h: 280 },
        { x: 700, y: 380, w: 14, h: 320 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'cloister' },
        { x: 1180, y: 320, w: 20, h: 80, target: 'archive' }
      ],
      decorations: [
        { type: 'codex', x: 250, y: 350 }, { type: 'codex', x: 280, y: 350 },
        { type: 'codex', x: 600, y: 250 }, { type: 'codex', x: 850, y: 400 },
        { type: 'codex', x: 1000, y: 350 }, { type: 'codex', x: 450, y: 500 },
        { type: 'fire', x: 500, y: 300 }, { type: 'fire', x: 950, y: 250 }
      ],
      enemies: [
        { type: 'bat', behavior: 'flit', x: 600, y: 350 },
        { type: 'bat', behavior: 'flit', x: 900, y: 200 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'An Open Page in a Codex',
          x: 450, y: 350,
          passage: '"They take of the milk of the rubber tree, and mix it with the juice of the vine called ololiuhqui. Boiled together, the mixture makes a substance called olli, which can be shaped into balls and other forms. The ball, when struck against the ground, leaps up of its own power. The fathers of our fathers used this material thus." — from a Sahagún codex, written in Nahuatl, c. 1577.',
          questions: [{
            q: 'According to the passage, who already knew how to make rubber when this was written down?',
            a: ['Only the Spanish friars', 'Only the king', "The fathers of fathers — meaning the Nahuatl writer's ancestors", 'Nobody anymore'],
            correct: 2,
            explain: 'The recipe was being recorded by people who already knew it from their own ancestors. The friars wrote it in Spanish; the Nahua co-authors knew it in their bones. The book is a memory of something not yet entirely lost.'
          }]
        }
      ],
      sparks: [
        { x: 200, y: 600, kind: 'prompt', text: 'A recipe written down in a book that nobody reads — does the recipe still exist? In what way?' }
      ]
    },
    {
      id: 'archive',
      name: 'The Deep Archive',
      width: 1000, height: 700,
      playerSpawn: { x: 60, y: 350 },
      isBossArea: true,
      bossSpawn: { x: 750, y: 350 },
      walls: [
        { x: 200, y: 100, w: 14, h: 500 },
        { x: 400, y: 100, w: 14, h: 250 },
        { x: 400, y: 450, w: 14, h: 150 },
        { x: 600, y: 200, w: 14, h: 400 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'scriptorium' }
      ],
      decorations: [
        { type: 'codex', x: 300, y: 200 }, { type: 'codex', x: 320, y: 250 },
        { type: 'codex', x: 500, y: 400 }, { type: 'codex', x: 800, y: 200 },
        { type: 'codex', x: 850, y: 600 }, { type: 'codex', x: 700, y: 500 },
        { type: 'fire', x: 100, y: 500 }, { type: 'fire', x: 900, y: 400 }
      ],
      enemies: [
        { type: 'bat', behavior: 'flit', x: 300, y: 400, baseX: 300, baseY: 400 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Note from a Modern Historian',
          x: 250, y: 400,
          passage: "By 1590, multiple Spanish-language manuscripts described, in plain detail, how Mesoamerican peoples made rubber. They explained the trees, the morning glory step, the boiling, the shaping. These books then sat in monastery and royal archives in Spain and Mexico for over 250 years. By the time European industry was finally ready to use rubber, in the 1830s, virtually nobody who mattered to the rubber industry had read these books. Charles Goodyear, working in his shop in Connecticut, never knew the recipe was already written down.",
          questions: [{
            q: 'Why is it striking that European chronicles described rubber-making in detail?',
            a: ['Because they were wrong', 'Because the recipe was written down for centuries before any European used it industrially', 'Because nobody could read Spanish', 'Because the books were censored'],
            correct: 1,
            explain: "It is the ghost at the heart of this whole story. The recipe was always available, in writing. It just sat in archives unread by the people who would later 'discover' rubber — because being written down isn't the same as being known."
          }]
        }
      ],
      sparks: [
        { x: 700, y: 600, kind: 'sensory', text: 'Centuries of dust on a single page, where the words "milk of the rubber tree" can still be read.' },
        { x: 900, y: 200, kind: 'prompt', text: 'What knowledge in our own time is written down but not yet known? Who would have to look for it before it became real?' }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'Friar Durán asks: "Why is writing something down not the same as it being known?"',
      a: [
        'The writing fades over time',
        'Only people who actively look for the writing can know what it says — knowledge requires seeking',
        'Books cost money',
        'Only friars can read'
      ],
      correct: 1,
      explain: '"Just so," he says. "A book on a shelf is potential, not actual. Until a curious person opens it, the words sleep."'
    },
    {
      q: 'He asks: "Who really wrote the codices, beyond the friars whose names are on them?"',
      a: [
        'Only the friars',
        'The Pope dictated them',
        'Indigenous scholars co-wrote them, often without credit',
        'They were copied from European books'
      ],
      correct: 2,
      explain: '"We could not have done it alone," he says quietly. "And history has been slow to write that down too."'
    }
  ]
};
