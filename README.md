# Pulse runner

An original one-button geometric arcade game for modern browsers. Jump over a
fixed sequence of spikes and blocks, learn the timing, and reach the finish line.
Canvas 2D art, physics and interface are implemented without runtime dependencies.

## Play

- Space, Up arrow, left click or touch on the game canvas: jump.
- P: pause/resume. R: restart (from the checkpoint when practicing).
- Choose one of three authored circuits, then Tranquilo, Pulsante or Intenso.
- Enable practice to unlock safe checkpoints as you advance on the ground.
  Retry from the last checkpoint, or choose Do início to reset the whole run.
  Checkpoints last only for the current session and reset when changing options.
- The game pauses when the page is hidden. Start again with Continue.
- Choose Pulse, Glacial, Nova or Brasa in the skin selector. Each has an original
  color and pattern; all share the same collision box and jump physics. Selecting
  a skin during a run pauses it. The choice is saved locally when storage works.
- On collision, the character breaks into 16 colored fragments before the result
  appears. Reduced-motion preference disables the breakup and its short delay.
- Best percentage is stored locally per circuit and difficulty, when storage is available.
  Practice never updates ranked bests. Original-circuit bests migrate from v0.1.

There are three circuits with different obstacle sequences and three speeds each.
The result screen shows progress and jumps for the attempt; finishing offers the
next circuit. There is no audio/music synchronization, login, network leaderboard or
in-app purchase. Progress is an informal local best, not a trusted online score.
The interface is Portuguese; source and developer documentation are English.

This is inspired by the one-button geometric runner genre. It is not affiliated
with Geometry Dash; no original game code, artwork, music, name or levels were copied.

## Run and learn

Use Node.js 22 or newer. No package installation is necessary.

```sh
npm test
npm run build
npm run dev
```

Open the loopback URL printed by the server. Serve dist/ through any static host
for deployment. ES modules require an HTTP server; do not open index.html directly
as a file. The Sites preview starts owner-private; publishing source to GitHub
does not automatically make that hosted preview public.

- src/engine.js: deterministic physics, fixed steps, buffered jump and SAT collision.
- src/game.js: input, canvas drawing, pause/death/completion flow and local best.
- src/records.js: validated local records, migration and practice exclusion.
- src/cosmetics.js: original skin artwork and bounded collision fragment data.
- src/style.css: responsive arcade page, reduced decorative motion.
- tests/engine.test.mjs: 15 tests, including all circuits at every speed and checkpoint recovery.

The collision hitbox is slightly inset and axis-aligned even while the square
visually rotates. This is a forgiving gameplay choice. Fixed small simulation
steps prevent narrow obstacles being skipped at higher speed. Long frame gaps are
capped, rather than fast-forwarded; very slow devices may slow gameplay. Frame
visibility pause prevents a hidden page silently advancing.

## Next possible increments

Optional original audio, configurable controls, full
localization and human playtesting for difficulty/accessibility. These are ideas,
not implemented features. Keyboard and DOM controls are available; the animated
canvas does not provide an equivalent screen-reader gameplay experience.

MIT license. See docs/verification.md for observed checks and limits.
