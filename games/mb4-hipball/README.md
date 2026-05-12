# Mr. Bananagrams 4 — Hipball

NBA-Jam-energy take on the ancient Mesoamerican ballgame. Strike a heavy rubber ball with **hip**, **knee**, or **elbow** — no hands, no feet, just like the real thing. First to **8 rayas** wins. Land it through the **stone hoop** at the back of the court and the match ends instantly.

2.5D Phaser game. Side-view trapezoidal court, ball with separate ground shadow, hot flame trails when you're on a streak.

## Modes

- **Single player** — vs CPU, three difficulty levels.
- **Local 2-player** — one keyboard, P1 on WASD/J/K/L, P2 on numpad.
- **Online** — PartyKit room codes. Host gets a 4-letter code, share it with player 2.

## Strike types

| Strike | Key | Use it when… | Tradeoff |
|--------|-----|--------------|----------|
| **Hip** | `J` | Reliable horizontal smash. Default. | Boring but works. |
| **Knee** | `K` | Drive the ball downward at the opponent's end. | Slower, harder to chain. |
| **Elbow** | `L` | Upward lob — your only shot at the **hoop**. | Long recovery; if you whiff in the air you're a sitting duck. |

Two consecutive successful strikes → small flame trail. Three → **ON FIRE** (the ball goes faster off your strikes until the opponent scores).

## Controls

**Player 1:** WASD to move and step into/out of the court · Space to jump · J/K/L for hip/knee/elbow.
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

## Power-up architecture (placeholder)

There's a `// TODO: educational unlock spawns here` marker inside `PlayScene._connectStrike`. The plan is:

- Each player has a `powerUps: Set<string>` set in match state.
- Powers up are picked up by answering on-screen questions during a rally (or between rallies).
- A `getStrikeModifiers(player, strikeType)` helper returns `{speedMult, sizeMult, knockbackMult, igniteOnHit, ...}` to scale the base strike.

The hooks are stubbed but no power-ups are wired yet — that's a follow-up pass once the gameplay shell is fun to play.

## Dropping into the existing arcade

Copy this entire folder to `mr-bananagrams-arcade/games/mb4-hipball/`, then run the arcade's `build-manifest.js` script to regenerate the top-level `games.json`. The `back-to-arcade` link in `index.html` points to `../../index.html`, which matches the arcade's expected nesting.

## Credits

Educational themes drawn from the historical Mesoamerican ballgame (*ōllamaliztli* / *tlachtli*, modern descendant *ulama*). The hoop-as-instant-win is a real feature of the Classic-period game and was reportedly extraordinarily rare in actual play.

Built with [Phaser 3](https://phaser.io) and [PartyKit](https://partykit.io).
