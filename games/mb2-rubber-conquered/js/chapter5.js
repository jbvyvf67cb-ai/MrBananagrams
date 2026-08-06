// ============================================================
//  CHAPTER 5 — The Court of Charles V (1528)
//  Chapter data — content preserved verbatim from the original build.
// ============================================================
'use strict';

const CHAPTER_5 = {
  num: 5,
  title: 'The Court of Charles V',
  subtitle: 'Cortés brings the wonder to Spain',
  era: '1528',
  location: 'Seville, Spain',
  intro: 'Seven years after the fall of Tenochtitlán, the conquistador Hernán Cortés arrives in Spain with treasures, captives, and forty Aztecs — including a full team of ballplayers. They are about to perform for King Charles V, Holy Roman Emperor. The European court is about to see something it has never seen before.',
  theme: 'spanish_court',
  bossName: 'King Charles V',
  bossPortrait: 'charles_v',
  bossRole: 'Holy Roman Emperor, King of Spain',
  bossIntro: 'A figure in dark velvet sits on a heavy throne. His jaw is famous — long, jutting. He looks at you the way a man looks at a problem he cannot quite finish solving. "Tell me what I have just witnessed."',
  combatAllowed: true,
  subAreas: [
    {
      id: 'courtyard',
      name: 'The Outer Courtyard',
      width: 1200, height: 800,
      playerSpawn: { x: 80, y: 400 },
      walls: [
        { x: 200, y: 100, w: 14, h: 200 },
        { x: 200, y: 100, w: 800, h: 14 },
        { x: 1000, y: 100, w: 14, h: 200 },
        { x: 200, y: 500, w: 14, h: 200 },
        { x: 200, y: 700, w: 800, h: 14 },
        { x: 1000, y: 500, w: 14, h: 200 }
      ],
      exits: [
        { x: 1180, y: 380, w: 20, h: 80, target: 'antechamber' }
      ],
      decorations: [
        { type: 'pillar', x: 300, y: 200 }, { type: 'pillar', x: 600, y: 200 },
        { type: 'pillar', x: 900, y: 200 }, { type: 'pillar', x: 300, y: 600 },
        { type: 'pillar', x: 600, y: 600 }, { type: 'pillar', x: 900, y: 600 },
        { type: 'flag', x: 500, y: 400, color: '#a83838' }, { type: 'flag', x: 800, y: 400, color: '#3a3a8a' }
      ],
      enemies: [
        { type: 'jaguar', behavior: 'jaguar', x: 700, y: 400, range: 150 }
      ],
      infoStops: [
        {
          type: 'npc', npcType: 'spanish_courtier',
          name: 'A Spanish Courtier',
          x: 350, y: 450,
          passage: 'You will not believe what we just witnessed. The conquistador Cortés has brought back living people from New Spain — they call themselves Mexica. They played a game with a ball that bounces by itself! No air inside, no spring, no trick. It just leaps when it hits the ground. The Italians and the Germans here say nothing has ever been seen like it. Some courtiers are calling it sorcery. Others are saying we should start a workshop to learn how to make it. Most are simply staring.',
          questions: [{
            q: 'What were the various reactions of the Spanish court to the rubber ball?',
            a: ['Everyone was excited about industrial uses', 'Reactions ranged from suspicion of sorcery, to wonder, to interest in learning the craft', 'It was politely ignored', 'It was rejected as fake'],
            correct: 1,
            explain: 'The court was genuinely divided. Wonder, suspicion, and curiosity all mixed. Despite a few suggestions that Spain should learn to make rubber, no serious effort was made — for nearly 250 more years.'
          }]
        }
      ],
      sparks: [
        { x: 600, y: 750, kind: 'sensory', text: 'Marble polished smooth by centuries of footsteps. A rubber ball striking it for the first time — the sound is wrong somehow, brighter than expected.' },
        { x: 1100, y: 750, kind: 'fact', text: 'The German artist Christoph Weiditz attended one of these performances and made the earliest European drawings of indigenous Mesoamericans we still have today.' }
      ]
    },
    {
      id: 'antechamber',
      name: 'Throne Room Antechamber',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      walls: [
        { x: 0, y: 0, w: 1100, h: 14 },
        { x: 0, y: 686, w: 1100, h: 14 },
        { x: 400, y: 100, w: 14, h: 100 },
        { x: 400, y: 400, w: 14, h: 200 },
        { x: 700, y: 100, w: 14, h: 200 },
        { x: 700, y: 400, w: 14, h: 100 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'courtyard' },
        { x: 1080, y: 320, w: 20, h: 80, target: 'exhibition' }
      ],
      decorations: [
        { type: 'pillar', x: 200, y: 350 }, { type: 'pillar', x: 900, y: 350 },
        { type: 'flag', x: 500, y: 300, color: '#a83838' },
        { type: 'crate', x: 850, y: 600 }
      ],
      enemies: [
        { type: 'jaguar', behavior: 'patrol', x: 500, y: 350, range: 100 }
      ],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Document on the Wall',
          x: 350, y: 280,
          passage: 'In 1528, Hernán Cortés returned to Spain to defend himself against accusations of corruption and brutality. He brought treasures, captives, and a full team of forty Aztec ballplayers. They had not freely chosen this voyage. Several would die of European diseases before any chance to return home. The performance for the king was both spectacle and exploitation — a fact that the courtiers who watched it largely did not consider, but which we should.',
          questions: [{
            q: 'How did the Aztec ballplayers come to be in Spain?',
            a: ['They sailed there to seek fortune', 'They were brought by Cortés, often against their will, as part of his return', 'They were sent by the Aztec emperor as ambassadors', 'They were Spanish converts'],
            correct: 1,
            explain: 'Cortés brought 40 Aztecs back to Spain, and most had not chosen to come. Some were nobility, some were performers, all were essentially captives. Several died of illness before any return.'
          }]
        }
      ],
      sparks: [
        { x: 800, y: 500, kind: 'prompt', text: 'A spectacle and an exploitation, in the same room, at the same time. How would you draw both at once?' }
      ]
    },
    {
      id: 'exhibition',
      name: 'The Exhibition Court',
      width: 1100, height: 700,
      playerSpawn: { x: 60, y: 350 },
      isBossArea: true,
      bossSpawn: { x: 850, y: 350 },
      walls: [
        { x: 0, y: 0, w: 1100, h: 14 },
        { x: 0, y: 686, w: 1100, h: 14 },
        { x: 0, y: 100, w: 14, h: 500 },
        { x: 1086, y: 100, w: 14, h: 500 }
      ],
      exits: [
        { x: 0, y: 320, w: 14, h: 80, target: 'antechamber' }
      ],
      decorations: [
        { type: 'pillar', x: 200, y: 250 }, { type: 'pillar', x: 200, y: 450 },
        { type: 'pillar', x: 1000, y: 250 }, { type: 'pillar', x: 1000, y: 450 },
        { type: 'flag', x: 550, y: 100, color: '#a83838' }, { type: 'flag', x: 550, y: 600, color: '#3a3a8a' }
      ],
      enemies: [],
      infoStops: [
        {
          type: 'plaque',
          name: 'A Notice Pinned to the Wall',
          x: 350, y: 350,
          passage: 'The Spanish court was amazed by the bouncing ball. So why did Spain not start making rubber? Several reasons. There were no rubber trees in Europe. The recipe for vulcanization with morning glory was not understood by the Spanish, only used in front of them. European industries did not yet need waterproof, elastic materials. There were no factories, no chemists, no demand. The wonder was filed away as exotic — a curiosity for kings, not a project for craftsmen.',
          questions: [{
            q: 'Why did Spain not develop rubber-making, despite seeing it work?',
            a: ['Spain was not interested in any new technology', 'No rubber trees in Europe, no understanding of the recipe, and no industrial demand', 'The Catholic Church forbade it', 'It was kept secret by the Aztec performers'],
            correct: 1,
            explain: "A wonder is not a product. To turn rubber into something Europeans would actually use, three things had to come together: access to the trees, knowledge of how to process the latex, and an industrial system that needed it. None of those existed in 1528. They wouldn't all align for over 300 more years."
          }]
        }
      ],
      sparks: [
        { x: 600, y: 500, kind: 'fact', text: 'Charles V ruled the largest European empire since Rome — Spain, the Holy Roman Empire, parts of Italy, and most of the Americas. Even with all that, he never funded a single rubber project.' },
        { x: 250, y: 500, kind: 'prompt', text: 'A wonder is not yet a product. What other wonders do we see today that we do not yet know what to do with?' }
      ]
    }
  ],
  bossQuestions: [
    {
      q: 'Charles V asks: "My court is amazed. My merchants are not interested. Why?"',
      a: [
        'Merchants do not value novelty',
        'Without a use the ball can be put to in industry, it has no market — it is only a curiosity',
        'Merchants only care about gold',
        'They think it is fake'
      ],
      correct: 1,
      explain: '"Yes," he says, leaning back. "Wonder is not yet money. Until someone needs this thing for a purpose I cannot yet imagine, it stays in my cabinet of curiosities."'
    },
    {
      q: 'He asks: "And how do we describe a thing that has no comparison in our world?"',
      a: [
        'We refuse to describe it',
        'We struggle, comparing it to many things we know, none of them quite right',
        'We make up a new language',
        'We pretend it is just like a leather ball'
      ],
      correct: 1,
      explain: '"Just so," he says. "I have heard it called a stone that lives, and a fruit that does not rot, and a piece of skin that argues with the floor. None is right. All are right."'
    }
  ]
};
