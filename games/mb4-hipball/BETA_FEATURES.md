# Beta Games — Arcade Convention

Mr. Bananagrams 4 (Hipball) is marked as a **beta** game. It will not appear in the arcade tile grid unless the user passes `?beta=1` in the URL.

## How to enable beta visibility

Visit the arcade with:

```
https://your-arcade-url/?beta=1
```

This flag is sticky for the current session (we can stash it in `sessionStorage` if you want) but does NOT persist across browser sessions by default. Bookmark the URL-with-flag.

## How a game opts into beta

Add `"beta": true` to the game's `game.json`:

```json
{
  "id": "mb4-hipball",
  "title": "Mr. Bananagrams 4",
  "beta": true,
  ...
}
```

That's it. The launcher does the rest.

## Drop-in launcher code

In the arcade launcher's JavaScript — wherever it iterates `games.json` to build the tile grid — add:

```js
// Read the beta flag once at startup
const params = new URLSearchParams(window.location.search);
const SHOW_BETA = params.get('beta') === '1';

// Filter the game list
const visibleGames = games.filter(g => !g.beta || SHOW_BETA);

// When rendering a tile, add a BETA badge if it's beta + visible:
function renderTile(game) {
  const tile = document.createElement('a');
  tile.href = `games/${game.id}/${game.entry}`;
  // ... your normal tile setup ...
  if (game.beta) {
    const badge = document.createElement('span');
    badge.className = 'beta-badge';
    badge.textContent = 'BETA';
    tile.appendChild(badge);
  }
  return tile;
}
```

## Drop-in CSS for the badge

```css
.beta-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #fde375;
  color: #ff4a1a;
  font-family: 'Black Ops One', 'Arial Black', sans-serif;
  font-size: 14px;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border: 2px solid #1a0820;
  border-radius: 4px;
  z-index: 2;
  text-shadow: 0 1px 0 #fff;
  transform: rotate(-6deg);
}
```

Matches the in-game BETA badge style for visual consistency.

## Why no password?

We considered:
- Game-specific passwords (too much config per game, hard to remember which is which)
- One shared password for all beta games (feels like security theater since the password ends up in client-side JS anyway, and there's no real attacker model — kids and their parents)
- URL flag (this approach — frictionless, bookmarkable, no false sense of security)

Going with the URL flag. If a real access-control need shows up later (e.g. an unreleased game that genuinely shouldn't be shipped to the public), we can revisit with proper server-side gating.
