# Mr. Bananagrams 4 — Hipball

NBA-Jam-energy take on the ancient Mesoamerican ballgame. Strike a heavy rubber ball with **hip**, **knee**, or **elbow** — no hands, no feet, just like the real thing. First to **8 rayas** wins. Land it through the **stone hoop** at the back of the court and the match ends instantly.

2.5D Phaser game. Side-view trapezoidal court, ball with separate ground shadow, hot flame trails when you're on a streak.

## Modes

- **Single player** — vs CPU, three difficulty levels.
- **Local 2-player** — one keyboard, P1 on WASD/Z/X/C, P2 on numpad.
- **Online** — PartyKit room codes. Host gets a 4-letter code, share it with player 2.

## Strike types

| Strike | Key | Use it when… | Tradeoff |
|--------|-----|--------------|----------|
| **Hip** | `Z` | Reliable horizontal smash. Default. | Boring but works. |
| **Knee** | `X` | Drive the ball downward at the opponent's end. | Slower, harder to chain. |
| **Elbow** | `C` | Upward lob — your only shot at the **hoop**. | Long recovery; if you whiff in the air you're a sitting duck. |

Two consecutive successful strikes → small flame trail. Three → **ON FIRE** (the ball goes faster off your strikes until the opponent scores).

## Controls

**Player 1:** WASD to move and step into/out of the court · Space to jump · Z/X/C for hip/knee/elbow.
**Player 2 (local):** Numpad 4/5/6/8 · Numpad 0 to jump · Numpad 1/2/3 for hip/knee/elbow.
**Touch:** on-screen buttons appear automatically on touch devices.

## Folder layout

```
mb4-hipball/
├── index.html
├── game.json              ← arcade manifest entry
├── css/
│   └── style.css
├── js/
│   ├── phaser.min.js      ← bundled (1.1MB, arcade-physics build)
│   ├── main.js            ← MB4 constants + Phaser bootstrap
│   ├── audio.js           ← Web Audio SFX + announcer stabs
│   ├── input.js           ← keyboard + touch input
│   ├── ai.js              ← single-player bot
│   ├── net.js             ← PartyKit WebSocket client
│   └── scenes/
│       ├── BootScene.js   ← programmatic textures
│       ├── TitleScene.js  ← mode select + MP lobby
│       ├── PlayScene.js   ← the match itself
│       └── MatchOverScene.js
└── server/
    ├── server.ts          ← PartyKit Durable Object
    ├── partykit.json
    ├── package.json
    └── tsconfig.json
```

## Running locally (single-player works zero-config)

The game runs from a plain file server. The fastest way:

```sh
cd mb4-hipball
python3 -m http.server 8000
# then visit http://localhost:8000/
```

Single-player and local 2-player work out of the box. **Online multiplayer needs the PartyKit server deployed** — see below.

## Deploying online multiplayer

The server is in `server/`. It's a tiny PartyKit Durable Object that relays input frames between the two clients.

```sh
cd server
npm install
npx partykit deploy --name mb4-hipball
```

The first deploy will ask you to sign in to PartyKit (free tier — runs on Cloudflare's edge). After deploy, PartyKit prints a host URL like `mb4-hipball.YOURNAME.partykit.dev`.

**Wire it into the client:** open `js/main.js`, find this line:

```js
MP: {
  PARTYKIT_HOST: '',   // ← put your deployed host here
```

…and set it to your host (no protocol, just the hostname). Reload the client. The online buttons on the title screen become active.

## How online multiplayer works

The server is a pure input relay. Both clients run the same deterministic simulation from the same starting state. Each frame, every client sends its own inputs, and receives the peer's inputs. They each apply both sets of inputs to their local sim.

This is the simplest possible netcode — no rollback, no server reconciliation. It will drift slightly under heavy packet loss, but for a 30-second rally on a decent connection it stays in step within a few pixels. Plenty good enough for couch-style fun.

When the match ends, both clients independently see the same end state and transition to the same MatchOver scene.

## Tuning the game

Everything game-feel-related lives in `js/main.js` under `window.MB4`:

- `STRIKES.hip|knee|elbow` — cooldowns, hitbox sizes, ball-velocity output
- `BALL` — gravity, bounce dampening, max speed
- `WIN_SCORE`, `STREAK_TO_FIRE`, `HOOP_INSTAWIN` — match rules
- `AI.aggressionByDifficulty` — bot tuning

## Math tiles + power-ups

Tiles with decimal/fraction comparisons (`1/2 > 0.3`, `0.625 = 5/8`, etc.) spawn on the court mid-rally and stick around for 6 seconds. Step on one to commit.

- ✓ **TRUE** → green flash + chime, random power-up from the pool of 8
- ✗ **FALSE** → red flash + buzzer, **you slip and fall** for 1.5 seconds — can't move, can't strike

The slip is the real penalty. While you're sprawled out, your opponent can pelt the ball past your end line. Read each tile carefully.

The equation bank has three tiers (easy/normal/hard) and difficulty scales with combined match score — early-rally tiles are halves and quarters, late-rally tiles are eighths and thirds. About 40 equations total; edit `js/math_tiles.js` to add more.

### The eight power-ups

Each correct tile pulls a random one from this pool. Duration in parentheses.

| Power-up | Effect | Duration |
|---|---|---|
| **Jaguar Step** | 50% faster movement | 6s |
| **Lightning Knee** | Knee strikes fire horizontally at 1.5x speed | 5s |
| **Obsidian Edge** | Your strikes knock the opponent backward | 6s |
| **Stone Hide** | Your body becomes a wall — ball bounces at full speed | 6s |
| **Quetzal Cloak** | Incoming strikes have no hitstop on you; less knockback | 6s |
| **Hummingbird Wings** | Double-jump + 40% higher jumps (better hoop access) | 8s |
| **Copal Smoke** | Semi-transparent — opponent and AI lose track of you | 6s |
| **Twin Sun** | Every strike spawns a second ball; either can score | 4s |

Multiple power-ups can stack (e.g., Jaguar Step + Obsidian Edge + Twin Sun is chaos).

### CPU bot behavior

In single-player, the bot also chases tiles AND avoids the ones it believes are wrong. Bot `mathSkill` by difficulty: easy 50%, normal 75%, hard 90%. The bot's belief about each tile is cached so it doesn't flip-flop between decisions.

Tuning is all in `js/main.js`:
- `MB4.MATH.SPAWN_INTERVAL_MS` — how often a new tile appears (default 6500ms)
- `MB4.MATH.MAX_TILES` — how many on court at once (default 2)
- `MB4.MATH.LIFESPAN_MS` — how long each tile lingers (default 6000ms)
- `MB4.MATH.SLIP_MS` — slip-and-fall penalty duration (default 1500ms)
- `MB4.POWERUPS.<kind>` — duration, modifiers, label
- `MB4.POWERUP_POOL` — the shuffle pool of available power-ups

## Scoring

- Each ball past the opponent's end line = 1 raya
- Each ball passed cleanly through the stone hoop at center court = 3 rayas
- First to 8 rayas wins the match

(Hoop pass-through requires the ball to be at the back wall depth and aligned vertically with the ring. The elbow strike has aim-assist that biases shots toward the hoop — see `MB4.STRIKES.elbow.aimAssistStrength` in `js/main.js`.)

## Music

The game ships with a procedurally-generated chiptune backing track — a Mesoamerican-flavored pentatonic loop synthesized in Web Audio. No assets required, works offline.

You can replace it with real music by dropping MP3 files into the `audio/` folder:

| Filename | Plays during |
|---|---|
| `audio/title.mp3` | Title screen (loops) |
| `audio/match.mp3` | Match play (loops) |
| `audio/win.mp3` | Match-over screen (one-shot) |
| `audio/lose.mp3` | Match-over screen, currently unused (one-shot) |

The game auto-detects these on launch — if a file is present, it's used; otherwise the synth loop plays.

### Recommended music

Alexandr Zhelanov's [**Aztec/Maya Style Music**](https://opengameart.org/content/aztecmaya-style-music) on OpenGameArt is a great fit. CC-BY 4.0 licensed (free for commercial use with attribution). Suggested mapping:

- `2_face_to_face.mp3` → save as `audio/match.mp3` (intense, loops well)
- `1_great_pyramids.mp3` → save as `audio/title.mp3` (atmospheric)
- `win.mp3` → save as `audio/win.mp3` (the bundle ships its own short win sting)

If you use these, add attribution somewhere (e.g. credits screen): *"Aztec/Maya Style Music by Alexandr Zhelanov, licensed CC-BY 4.0."*

## Announcer

When a powerup activates, the game uses the browser's Web Speech API to actually speak the powerup name. Most modern browsers support this out of the box. On systems where TTS isn't available (some embedded views, older browsers), it falls back to the synth stab without speech — the visual flash and SFX still play.

## Dropping into the existing arcade

Copy this entire folder to `mr-bananagrams-arcade/games/mb4-hipball/`, then run the arcade's `build-manifest.js` script to regenerate the top-level `games.json`. The `back-to-arcade` link in `index.html` points to `../../index.html`, which matches the arcade's expected nesting.

## Credits

Educational themes drawn from the historical Mesoamerican ballgame (*ōllamaliztli* / *tlachtli*, modern descendant *ulama*). The stone hoop is a real feature of the Classic-period game — landing the ball through it was reportedly extraordinarily rare in actual play, hence the rich scoring reward.

Built with [Phaser 3](https://phaser.io) and [PartyKit](https://partykit.io).
