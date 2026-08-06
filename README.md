# Mr. Bananagrams Arcade

A growing collection of educational HTML5 games. Each cabinet is a self-contained
adventure built around a real subject — history, poetry, science. Designed to
be added to indefinitely without touching the launcher itself.

## What's inside

```
mr-bananagrams-arcade/
├── index.html                        ← the launcher (title screen)
├── launcher.js                       ← renders the game cards
├── games.json                        ← auto-generated manifest (DO NOT hand-edit)
├── shared/arcade.css                 ← launcher styles
├── games/
│   ├── mb1-rubber-adventure/         ← MB1 (Phaser platformer)
│   ├── mb2-rubber-conquered/         ← MB2 (placeholder — coming soon)
│   └── mb3-golden-shovel/            ← MB3 (Phaser platformer)
├── scripts/build-manifest.js         ← scans games/ and writes games.json
└── .github/workflows/build-manifest.yml
                                      ← rebuilds manifest + deploys on push
```

Each `games/<id>/` folder holds one game. The folder name is the game's `id`.

## How to add a new game

This is the whole workflow. There is no "register the game with the launcher"
step — the manifest builder picks up new games automatically.

### 1. Create the game folder

```bash
mkdir games/mb4-something-new
```

The folder name will be the game's `id`. Use lowercase, hyphenated.

### 2. Add a `game.json` to the folder

This is the only metadata the launcher cares about:

```json
{
  "id": "mb4-something-new",
  "title": "Mr. Bananagrams 4",
  "subtitle": "Something Wonderful",
  "tagline": "One sentence about why this game exists.",
  "entry": "index.html",
  "order": 40,
  "themeColor": "#7fb069",
  "accentColor": "#c9a23a",
  "engine": "phaser-platformer",
  "ageRange": "8+",
  "subjects": ["history", "science"],
  "status": "ready"
}
```

Key fields:
- `id` — must match the folder name exactly
- `entry` — path inside the folder, usually `index.html`
- `order` — sort key on the launcher (low = shown first; MB1=10, MB2=20, MB3=30, so MB4=40)
- `themeColor` — accent color for the card (top stripe + hover border)
- `status` — `ready` to be playable; `coming` to show a "Coming Soon" tile (no entry-file requirement)

### 3. Build the game

The game's `index.html` is opened directly when the user clicks its card. The
URL will be `<arcade>/games/<id>/<entry>`. Anything inside the folder is yours.

If your game is a Phaser platformer, the cleanest approach is to copy
`games/mb1-rubber-adventure/` or `games/mb3-golden-shovel/` as a starting point.

Add a back-to-arcade link inside the game so players can return:

```html
<a id="back-to-arcade" href="../../index.html" title="Back to Arcade">🏠</a>
```

(See either MB1 or MB3 for the matching CSS.)

### 4. Regenerate the manifest

```bash
node scripts/build-manifest.js
```

This scans every `games/*/game.json`, validates them, and writes `games.json`
at the repo root. Run before opening `index.html` locally, or just push — the
GitHub Action regenerates the manifest on every push to `main`.

### 5. Push

```bash
git add games/mb4-something-new games.json
git commit -m "Add MB4: Something Wonderful"
git push
```

The GitHub Action will:
1. Re-run `build-manifest.js`.
2. Commit the updated `games.json` if it differs.
3. Publish the whole repo to GitHub Pages.

## Running locally

The launcher uses `fetch()` to load `games.json`, which is blocked from
`file://`. So you need any local web server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .

# Or any static server you like
```

Then open <http://localhost:8000>.

Individual games can be opened from `file://` directly (each is self-contained
HTML), but the launcher itself needs HTTP.

## Hand-editing `games.json`

You can, but the build script will overwrite your changes on the next run.
Hand-edits belong in the per-game `game.json`, which IS the source of truth.

The one valid reason to hand-edit `games.json`: temporarily reordering or
hiding a game without committing changes to its folder. Even then, prefer
adjusting the `order` field in the game's own `game.json`.

## GitHub Pages setup

Once: in your repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
The workflow handles everything else.

## Adding a non-Phaser game

The launcher doesn't care what's inside `games/<id>/`. Vanilla canvas, Three.js,
React, Phaser — any folder with an `index.html` (or whatever you set as `entry`)
will work. Set the `engine` field in `game.json` to whatever you want; it's
informational, not enforced.

## Game formats currently in the arcade

- `phaser-platformer` — side-scroll, gravity, throw projectiles, boss fights
  (MB1, MB3). See `games/mb3-golden-shovel/README.md` for engine notes.
- `phaser-adventure` (planned, MB2) — top-down NPC-driven adventure with
  notebooks, sparks, world map. To be implemented.
- `phaser-2.5d` (MB4) — Hipball: a rubber-ball court sport (see
  `games/mb4-hipball/`).
- `babylon-3d` (MB4D) — 3D Super-Mario-64-style platformer where every object
  has 40+ sides; rescue stray dogs across five levels. The card opens a landing
  page linking every frozen build (`v0`–`v15`); newest is playable at
  `games/mb4d-portal-world/versions/v15/`.
