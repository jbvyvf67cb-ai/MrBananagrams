// ============================================================
//  CHAPTERS INDEX + WORLD MAP
//
//  Assembles the nine chapter modules into the CHAPTERS array the
//  rest of the game reads, and holds the world-map pin/segment
//  geometry drawn on the 800x440 parchment between chapters.
//  Load order: chapter1..9 must be loaded before this file.
// ============================================================
'use strict';

const WORLD_MAP = {
  pins: [
    { chapter: 1, x: 220, y: 220, label: 'Olmec Coast' },           // Veracruz / Gulf
    { chapter: 2, x: 200, y: 240, label: 'Tenochtitlán' },          // central Mexico
    { chapter: 3, x: 270, y: 250, label: 'Hispaniola' },            // Caribbean
    { chapter: 4, x: 200, y: 240, label: 'Tenochtitlán falls' },    // back to Mexico
    { chapter: 5, x: 470, y: 200, label: 'Court of Charles V' },    // Seville
    { chapter: 6, x: 480, y: 215, label: 'The Library' },           // Spain (slightly offset)
    { chapter: 7, x: 240, y: 320, label: 'The Amazon' },            // Brazil
    { chapter: 8, x: 200, y: 170, label: "Goodyear's shop" },       // New England
    { chapter: 9, x: 700, y: 280, label: 'Kew → Malaya' }           // Asia
  ],
  segments: [
    { from: 1, to: 2, mode: 'land', path: [{x:220,y:220},{x:210,y:230},{x:200,y:240}] },
    { from: 2, to: 3, mode: 'sea',  path: [{x:200,y:240},{x:230,y:250},{x:270,y:250}] },
    { from: 3, to: 4, mode: 'sea',  path: [{x:270,y:250},{x:230,y:248},{x:200,y:240}] },
    { from: 4, to: 5, mode: 'sea',  path: [{x:200,y:240},{x:280,y:230},{x:380,y:215},{x:470,y:200}] },
    { from: 5, to: 6, mode: 'land', path: [{x:470,y:200},{x:475,y:208},{x:480,y:215}] },
    { from: 6, to: 7, mode: 'sea',  path: [{x:480,y:215},{x:380,y:260},{x:300,y:300},{x:240,y:320}] },
    { from: 7, to: 8, mode: 'sea',  path: [{x:240,y:320},{x:220,y:260},{x:210,y:200},{x:200,y:170}] },
    { from: 8, to: 9, mode: 'sea',  path: [{x:200,y:170},{x:300,y:170},{x:450,y:185},{x:560,y:230},{x:700,y:280}] }
  ]
};

const CHAPTERS = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5, CHAPTER_6, CHAPTER_7, CHAPTER_8, CHAPTER_9];
