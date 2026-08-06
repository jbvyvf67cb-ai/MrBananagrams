# MB2 — How Rubber Conquered the World

A top-down adventure across nine chapters, from an Olmec bog around 1500 BCE to
the rubber plantations of Malaya. The player walks Mr. Bananagram through each
era, reads plaques, talks to NPCs, answers a question at each stop, and collects
"sparks" — ideas saved into an art-project notebook that can be exported at the
end. Two saved ideas per chapter unlock that chapter's boss, which is a
conversation rather than a fight.

Plain canvas 2D, no engine, no build step.

## Layout

```
mb2-rubber-conquered/
├── index.html          markup + script tags (load order matters)
├── css/style.css
└── js/
    ├── config.js       tuning constants, scoring, ranks, themes, NPC palettes
    ├── state.js        the shared `game` object
    ├── util.js         math, HTML escaping, in-place array compaction, particles
    ├── chapter1..9.js  chapter content (prose, questions, level geometry)
    ├── chapters.js     assembles CHAPTERS + world-map pins/segments
    ├── ui.js           canvas scaling, overlay show/hide, HUD
    ├── flow.js         chapter & sub-area lifecycle, damage, win/lose
    ├── input.js        keyboard + on-screen controls
    ├── worldmap.js     the between-chapters parchment
    ├── infostop.js     plaques and NPC conversations
    ├── boss.js         end-of-chapter conversations
    ├── notebook.js     sparks, notebook pages, export sheet
    ├── update.js       one fixed simulation step
    ├── render.js       the scene
    └── main.js         fixed-timestep loop + DOM wiring
```

Scripts are plain classic scripts sharing globals, matching MB3's convention in
this arcade. `js/chapter1..9.js` must load before `js/chapters.js`, and
`js/config.js` / `js/state.js` before everything else.

## Editing content

All prose, questions, and level layout live in `js/chapterN.js`. Each chapter is
one object:

- `subAreas[]` — a walkable area with `width`/`height`, `walls`, `exits`
  (`target` names another sub-area's `id`), `decorations`, `enemies`,
  `infoStops`, and `sparks`. One sub-area sets `isBossArea: true`.
- `infoStops[]` — a `plaque` or an `npc` with a `passage` and `questions[]`
  (`q`, `a[]`, `correct` index, `explain`).
- `sparks[]` — `kind` is `fact`, `sensory`, or `prompt`; the `text` is what gets
  written into the notebook.
- `bossQuestions[]` — same shape as info-stop questions. A question marked
  `reflective: true` accepts every answer and uses `explainOptions[]` for
  per-answer feedback (used where there is no single defensible answer).
- `combatAllowed: false` disables peel-throwing for a chapter (Chapter 4 uses
  this — you cannot fight your way through the fall of Tenochtitlán).

Adding a chapter means adding `chapterN.js`, listing it in `index.html`, and
appending it to the `CHAPTERS` array plus a pin/segment in `WORLD_MAP`.

## Notes on the port

Ported from a single 4,466-line HTML file. All chapter text is byte-identical to
the original; the changes are structural and to the engine:

- **Fixed timestep.** The world advanced once per animation frame, so every
  speed and timer was really "per frame" — the game ran at double speed on a
  120Hz display and 4x on a 240Hz one. The simulation now runs in fixed 1/60s
  steps while rendering stays uncapped.
- **Ground layer.** The checkerboard was ~147 `fillRect` calls every frame; it
  is now a cached `CanvasPattern` drawn in one fill.
- **Idle rendering.** The scene redrew at 60fps behind full-screen overlays.
  Only the play phase animates now; other phases draw one transition frame.
- **World map.** A `setInterval` redrew it every 100ms for the life of the page,
  re-randomising 200 paper specks each time, so the parchment visibly crawled.
  The static layer is baked once into an offscreen canvas and redraws are driven
  from the main loop only while the map is open.
- **Notebook return.** `closeNotebook` inferred where the player came from with
  `currentChapterIdx >= chaptersCompleted`, which is true during every normal
  chapter — so closing the notebook mid-chapter dumped you onto the world map
  and abandoned the chapter. The origin phase is now recorded.
- **Death during a quiz.** A wrong answer costs HP, so the fatal hit could land
  with the quiz overlay still open; it was never hidden, and the stale panel
  reappeared over the game after the restart. Failing now clears all overlays.
- **Quiz buttons.** The "Try Again" step worked by reassigning `button.onclick`
  from inside the answer handler; it is a single handler plus a pending-retry
  flag now.
- Smaller fixes: particles spawned pre-faded (`maxLife` was hard-coded to 40
  regardless of actual life), `slipVx`/`slipVy` went `NaN` until first use,
  `switch` cases declared `const` in a shared scope, notebook/export HTML is
  escaped, held keys are released on window blur, and the nearest-info-stop
  scan ran twice per frame (update + render) instead of once.
