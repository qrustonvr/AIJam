# Cannon Quack

A Vegas Infinite **original** casino game — built for the Casino Original Challenge game jam.

> One shot. One bet. Mind the wind.

Aim a golden cannon, time the power meter, and launch the Vegas Infinite ducky across the strip. Land on a multiplier zone for the payout. Distant zones pay more — but the wind never blows the same way twice.

---

## Live demo

After you push and enable GitHub Pages, this will be live at:
`https://<your-username>.github.io/AIJam/`

## Local development

No build step. Browsers block ES module imports over `file://`, so you need a static server.

**Easiest (Windows):** double-click `serve.bat`. It auto-detects Python or Node, starts a server, and opens the browser for you.

**Or run manually:**
```bash
# Python (most likely already installed)
python -m http.server 8000

# Or Node
npx serve .
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Initialize the repo and push to `main`:
   ```bash
   cd D:\Repos\AIJam
   git init
   git add .
   git commit -m "Initial scaffold: playable Cannon Quack prototype"
   git branch -M main
   git remote add origin https://github.com/<your-username>/AIJam.git
   git push -u origin main
   ```
2. On GitHub: **Settings -> Pages -> Source: Deploy from a branch -> Branch: `main` / `/ (root)` -> Save**.
3. Wait ~60s. Pages URL will appear at the top of the Pages settings.

That's it. Every push to `main` redeploys.

## Stack

- HTML5 Canvas 2D
- Vanilla JavaScript (ES modules)
- Pure CSS, no framework
- Static hosting (GitHub Pages)

## File layout

```
AIJam/
  index.html            Shell + HUD markup
  styles/main.css       VI palette + HUD styling
  scripts/
    main.js             Game loop, state machine, boot
    config.js           Physics constants, zones, multipliers
    physics.js          Projectile motion, wind, collision, zone lookup
    render.js           Canvas drawing (sky, terrain, cannon, ducky)
    input.js            DOM input wiring
    ui.js               HUD updates
    audio.js            SFX stubs (drop files in assets/sounds/)
  assets/
    images/             AI-generated sprites go here
    sounds/             SFX files go here
  README.md
  .gitignore
```

## Game design

### Round loop
1. **BETTING** -- set bet amount (10-500 chips)
2. **AIMING** -- set cannon angle (10 deg-80 deg)
3. **POWERING** -- needle oscillates left to right; tap **FIRE** (or SPACE) to lock power
4. **FIRING** -- projectile arcs across the strip with continuous wind force
5. **RESOLVING** -- landing zone determines payout; play again

### Multiplier zones (left -> right)

| Zone        | Range (px) | Multiplier |
|-------------|------------|------------|
| Bust pit    | 165-250    | 0x         |
| Hills 1     | 250-420    | 1.5x       |
| Hills 2     | 420-580    | 2x         |
| Valley      | 580-780    | 4x         |
| Cliff       | 780-950    | 10x        |
| Ledge       | 950-1080   | 25x        |
| Bullseye    | 1080-1175  | 100x       |
| Void        | 1175+      | 0x         |

### Wind
Randomized per round. Continuous horizontal force applied during flight. Strength shown 0/5-5/5 in the top-right HUD; arrow shows direction. A 5/5 wind shifts landing by ~150 px over a full-distance shot.

### Power
Needle ping-pongs across a horizontal track at constant speed. Stop near the left -> short shot. Stop near the right -> long shot. Velocity is mapped linearly from 8 to 23 units/frame across the track.

## Roadmap

- [x] Core physics & landing detection
- [x] Bet -> aim -> power -> fire round loop
- [x] Persistent balance via localStorage
- [x] Vegas Infinite palette + HUD scaffolding
- [x] Placeholder ducky, cannon, terrain art
- [ ] **AI-generated sprites** (ducky, cannon, parallax background, skyline)
- [ ] **Sound effects** (cannon boom, quack, splash, win stinger)
- [ ] **Ambient music** loop (Suno)
- [ ] **Polish:** smoke particles on fire, screen shake on big wins, slow-mo on near-misses
- [ ] **Trailer:** capture gameplay, assemble with Suno + Gemini Veo

## Tuning notes

All constants live in `scripts/config.js`. Common knobs:

- `GRAVITY` (0.45) -- higher = shorter arcs
- `WIND_MAX` (0.12) -- higher = more chaos
- `POWER_MIN_VEL` / `POWER_MAX_VEL` -- shot distance range
- `ZONES` -- adjust boundaries and multipliers to retune win rate
- Target ~25-35% non-bust win rate based on quick playtest

## Brand

Vegas Infinite palette in `:root` CSS variables:
- Deep purple `#0a021a` -> `#4a1361`
- Magenta `#d72b78`
- Gold `#ffd33d`
- Neon cyan `#00e5ff`

The ducky lives. 🦆
