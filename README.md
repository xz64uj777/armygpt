# IRON PASS — Combat Engineer Command

A playable, single-player **3D military engineering sandbox** built for the browser. Drive heavy engineer vehicles through a procedurally modeled mountain valley and reopen a vital supply corridor.

## Play

Open **`index.html`** in a modern browser (or host the directory as a static website). The Three.js engine loads from a public CDN, so an internet connection is needed on first load. Works on desktop and modern mobile browsers.

A local development server is recommended:

```bash
python3 -m http.server 8080
# visit http://localhost:8080
```

## Mission: Operation Breakthrough

1. **Clear the landslide** — Select the D7 armored dozer (`1`), drive to the road blockage, and activate the work operation.
2. **Bridge the river** — Select the M60 bridge layer (`2`), drive to the south bank, and deploy the modular bridge.
3. **Recover the vehicle** — Select the HEMTT recovery truck (`3`), reach the disabled vehicle, and execute recovery.
4. **Escort the convoy** — Once all three tasks are done, choose **Dispatch Convoy**. Watch the supply trucks cross the repaired route to complete the operation.

## Controls

| Desktop | Action |
|---|---|
| W / S or ↑ / ↓ | Forward / reverse |
| A / D or ← / → | Steer |
| 1 / 2 / 3 | Choose engineer asset |
| Space | Activate engineering operation / dispatch |
| C | Cycle follow / close / strategic camera |
| Mouse drag | Orbit camera |
| Mouse wheel | Zoom |
| H | Field manual |

**Mobile:** use the onscreen joystick to drive, the **WORK** button for engineering operations, and **CAM** to change views. Tap vehicle cards to select different machines.

## Features

- Real-time Three.js 3D with procedural terrain, water, forests, rocks, outposts, and infrastructure
- Three selectable, custom-modeled vehicles: D7 dozer, M60 bridge layer, HEMTT recovery
- Four-stage interactive engineering scenario with mission-state progression
- Working deployable bridge that opens the crossing
- Autonomous four-truck supply convoy with a clear win condition
- Follow/orbit/strategic camera, minimap, target markers, telemetry, and responsive mission HUD
- Dynamic clear/storm weather switch, optional synthesized UI audio, and touch controls
- No art downloads, user accounts, databases, or paid services needed

## Technology

Vanilla HTML, CSS, JavaScript, and **Three.js 0.171.0** via CDN. No compilation or build step. All vehicles and terrain are generated from geometry in `game.js`.

This is a fictional single-player game, not an engineering training or tactical simulation.