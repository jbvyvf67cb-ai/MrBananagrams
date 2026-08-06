// ============================================================
//  CHAPTER 4 — The Fall of Tenochtitlan (1519-1521)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_4 = {
  num: 4,
  title: 'The Fall of Tenochtitlán',
  subtitle: 'A city ends',
  era: '1519–1521',
  location: 'The Valley of Mexico',
  intro: 'The journey turns dark. In 1521, after a brutal siege, the city of Tenochtitlán has fallen. Smoke still hangs in the air. The ballgame is over, perhaps forever. You walk through what is left, listening for what survived. There is no fighting in this place — only witnessing. (Your banana peels are put away here.)',
  theme: 'tenochtitlan_ruins',
  bossName: 'A Surviving Chronicler',
  bossPortrait: 'aztec_chronicler',
  bossRole: 'Aztec scribe, witness',
  bossIntro: 'A woman in a torn cloak sits by a wall. She holds a small, half-finished codex on her lap. She does not look up at first. "If you have come this far, you must answer carefully. There are no easy answers in this place."',
  combatAllowed: false,
  subAreas: [
    {
      id: 'causeway',
      name: 'The Burned Causeway',
      width: 1200, height: 700,
      playerSpawn: { x: 80, y: 350 },
      walls: [
        { x: 300, y: 100, w: 30, h: 220 },
        { x: 300, y: 380, w: 30, h: 220 },
        { x: 700, y: 0, w: 30, h: 280 },
        { x: 700, y: 350, w: 30, h: 350 }
      ],
      exits: [
        { x: 1180, y: 320, w: 20, h: 80, target: 'market' }
      ],
      decorations: [
        { type: 'rubble', x: 200, y: 250 }, { type: 'rubble', x: 450, y: 350 },
        { type: 'rubble', x: 800, y: 250 }, { type: 'rubble', x: 1000, y: 400 },
        { type: 'rubble', x: 600, y: 500 }, { type: 'rubble', x: 350, y: 600 }
      ],
      enemies: [
        { type: 'conquistador_patrol', behavior: 'patrol', x: 500, y: 350, range: 100 },
        { type: 'conquistador_patrol', behavior: 'patrol', x: 900, y: 250, range: 80 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Charred Wooden Sign',
          x: 450, y: 280,
          passage: 'In 1519, Hernán Cortés landed at the coast with about 600 Spanish soldiers, 15 horses, and 15 cannons. Through alliances with the Aztecs\' enemies — especially the Tlaxcalans — and through smallpox, which killed huge portions of the population including the emperor Cuitláhuac, the Spanish brought down the empire. The siege of Tenochtitlán ended on August 13, 1521. The city as the Aztecs had built it was effectively destroyed.',
          questions: [{
            q: 'Which factors contributed most to the fall of the Aztec Empire?',
            a: ['Spanish weapons alone', 'A combination of Spanish weapons, indigenous allies, and devastating disease', 'Aztec internal rebellion', 'Famine'],
            correct: 1,
            explain: 'No single factor explains the conquest. Smallpox alone may have killed more people than the Spanish armies. Indigenous allies (especially Tlaxcalans) provided much of the army that took Tenochtitlán. The "Spanish conquest" was always many things at once.'
          }]
        }
      ],
      sparks: [
        { x: 1000, y: 200, kind: 'sensory', text: 'The smell of wet ash, four months after the fires went out.' },
        { x: 200, y: 600, kind: 'prompt', text: 'How do you draw silence in a place that used to be loud?' }
      ]
    },
    {
      id: 'market',
      name: 'The Ruined Marketplace',
      width: 1200, height: 800,
      playerSpawn: { x: 60, y: 400 },
      walls: [
        { x: 200, y: 200, w: 60, h: 14 }, { x: 200, y: 200, w: 14, h: 60 },
        { x: 500, y: 500, w: 60, h: 14 }, { x: 500, y: 500, w: 14, h: 60 },
        { x: 800, y: 250, w: 80, h: 14 }, { x: 800, y: 250, w: 14, h: 80 },
        { x: 868, y: 250, w: 14, h: 80 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'causeway' },
        { x: 1180, y: 380, w: 20, h: 80, target: 'chamber' }
      ],
      decorations: [
        { type: 'rubble', x: 350, y: 350 }, { type: 'rubble', x: 700, y: 450 },
        { type: 'rubble', x: 950, y: 600 }, { type: 'rubble', x: 250, y: 700 },
        { type: 'crate', x: 600, y: 600 }, { type: 'crate', x: 400, y: 200 },
        { type: 'fire', x: 1050, y: 350 }
      ],
      enemies: [
        { type: 'conquistador_patrol', behavior: 'patrol', x: 600, y: 350, range: 200 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'aztec_chronicler',
          name: 'An Aztec Elder',
          x: 320, y: 450,
          passage: 'My grandmother taught me to wind the rubber strips around a stone core to make a ball. She said the rubber was alive — it remembered the trees, the morning glory, the hands that shaped it. After the city fell, many things stopped. The temples are silent. Some of us still know how to make a ball, but we have nowhere to play. The trees still drip in the forest, but for now, no one comes to tap them. The knowledge is in our hands. We are waiting.',
          questions: [{
            q: 'What does the elder mean when she says "the knowledge is in our hands"?',
            a: ['She is holding a written manual', 'The skill of rubber-making survived in living people, even when the cities and temples did not', 'She has stolen the recipe from someone', 'She is preparing to share it with the Spanish'],
            correct: 1,
            explain: 'Knowledge can survive without buildings or institutions, as long as the people who carry it survive. The rubber-making tradition was kept alive in fragments through the worst years, by people who refused to forget.'
          }]
        }
      ],
      sparks: [
        { x: 750, y: 700, kind: 'sensory', text: "A child's hand-sized rubber ball, half-buried in a pile of broken pottery. It still bounces." },
        { x: 1000, y: 250, kind: 'prompt', text: 'When something is destroyed but not entirely lost, what survives? What goes? Is the surviving piece still the same thing?' }
      ]
    },
    {
      id: 'chamber',
      name: 'A Hidden Chamber',
      width: 900, height: 600,
      playerSpawn: { x: 60, y: 300 },
      isBossArea: true,
      bossSpawn: { x: 700, y: 300 },
      walls: [
        { x: 200, y: 100, w: 14, h: 400 },
        { x: 500, y: 200, w: 14, h: 250 }
      ],
      exits: [
        { x: 0, y: 270, w: 14, h: 80, target: 'market' }
      ],
      decorations: [
        { type: 'codex', x: 350, y: 300 }, { type: 'codex', x: 380, y: 320 },
        { type: 'rubble', x: 600, y: 450 }, { type: 'rubble', x: 800, y: 200 },
        { type: 'fire', x: 750, y: 450 }
      ],
      enemies: [],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Hidden Codex',
          x: 250, y: 350,
          passage: 'Some of the codices — the painted books of the Aztec — were burned by Spanish friars who saw them as devil-worship. But others were hidden, or buried, or copied in secret. A few would be rediscovered centuries later. They contained calendars, histories, recipes, and prayers. Some of them, in their cramped margins, mentioned the rubber ball. The knowledge had not been lost — only put to sleep.',
          questions: [{
            q: 'What happened to most of the Aztec codices after the conquest?',
            a: ['They were sent to the Vatican intact', 'Many were burned, but some were hidden, copied, or buried — and some survived', 'They all were lost forever', 'They were translated and published in Spain'],
            correct: 1,
            explain: 'The Aztec codices had a complicated fate. Friar Diego de Landa famously burned dozens in the Yucatán. But others were saved by indigenous scribes, hidden, or copied. The surviving codices are among our most important historical sources.'
          }]
        }
      ],
      sparks: [
        { x: 600, y: 350, kind: 'fact', text: 'The Florentine Codex, completed in the 1570s by Friar Sahagún working with Nahua scholars, is one of the greatest single sources we have on the world the conquest erased.' }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'The chronicler asks: "What do you think should be remembered most about what happened here?"',
      reflective: true,
      a: [
        'How quickly such a great city could fall',
        "How knowledge survived in fragments, in people's hands and hidden books",
        'How disease may have killed more than weapons did',
        'All of these matter — and they each tell a different part of the story'
      ],
      correct: 3,
      explainOptions: [
        '"The speed of a fall is one truth," she says quietly. "It teaches that what seems permanent often is not."',
        '"You see the light," she says. "When buildings are gone, what people carry inside is what continues."',
        '"Yes, that is also true," she says. "We do not always die from the obvious causes."',
        '"You are wise enough to refuse a single answer," she says. "Hold all of them. Let them argue with each other in your mind."'
      ]
    },
    {
      q: 'She asks: "What is at risk of being forgotten?"',
      reflective: true,
      a: [
        'The names and voices of ordinary people',
        'The ways things were made — the recipes, the techniques',
        'The songs and stories told before bedtime',
        'All of the above are fragile in different ways'
      ],
      correct: 3,
      explainOptions: [
        '"Names go first," she nods. "And then the stories about the names."',
        '"Yes," she says. "When the maker dies and has not yet taught another, a thread breaks."',
        '"The small things," she says. "What people sang to their children. We rarely write that down."',
        '"All of it," she says. "All of it is fragile. That is why we put one word in front of another."'
      ]
    }
  ]
};
