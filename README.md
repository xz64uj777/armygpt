# IRON PASS — Combat Engineer Command

A playable, single-player **3D military engineering sandbox** built for the browser. Drive heavy engineer vehicles through a procedurally modeled mountain valley and reopen a vital supply corridor.

## Play

Play the production deployment at https://armygpt-iron-pass.vercel.app/. The engine is packaged with the game, so it no longer depends on third-party CDNs at startup. Works on desktop and modern mobile browsers.

For development:

```bash
npm install
npm run dev
# open the local URL printed by Vite
```

For a production build run `npm run build` (output in `dist/`). This is a Vite application.

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

Vanilla HTML, CSS, JavaScript, **Three.js 0.171.0**, and **Vite** to bundle the engine locally. All vehicles and terrain are generated from geometry in `game.js`.

This is a fictional single-player game, not an engineering training or tactical simulation.


## Mobile controls (phones and tablets)

The game offers onscreen analog steering, **hold DRIVE** and **hold REVERSE** pedals, a contextual **WORK** button, and **CAM** to change views. Drag a finger across the terrain to rotate the camera and pinch to zoom. Tap any asset in the bottom bar to switch vehicles. The analog pad also supports pushing up/down to drive without pedals. Controls appear automatically on touch-capable landscape or portrait screens, not just narrow phones. Press-and-hold controls stop on release, cancelled touch, or lost window focus.
## Phase II — Diggable earthworks

- **E390 Tactical Excavator:** select with **4** or the fourth fleet button. Drive off the road, then press **WORK / DIG** to excavate soil.
- Each cycle deforms the ground into a cut and spoil mound. Repeated passes deepen the trench, and the tactical map displays disturbed soil.
- After the convoy reaches the base, choose **CONTINUE IN FREEPLAY** to keep driving and excavating.
- Excavation is restricted away from the road and river crossing to protect mission geometry.

## Rear chase camera (Phase II update)

- Each mission starts in a rear follow-camera relative to the currently selected machine. Switching machines automatically recovers the behind-the-machine view.
- Drag/swipe on the 3D scene to orbit and pinch/scroll to zoom.
- Double tap on the 3D scene (double click on desktop), or press **R**, to restore the default behind-vehicle chase view. Camera mode button cycles rear-follow zoom/elevation presets.
