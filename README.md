# Pulse runner

An original one-button geometric arcade game for modern browsers. Jump over a
fixed sequence of spikes and blocks, learn the timing, and reach the finish line.
Canvas 2D art, physics and interface are implemented without runtime dependencies.

## Play

- Space, Up arrow, left click or touch on the game canvas: jump.
- P: pause/resume. R: restart.
- Choose Tranquilo, Pulsante or Intenso for three speeds of the same circuit.
- The game pauses when the page is hidden. Start again with Continue.
- Best percentage is stored locally per difficulty, when browser storage is available.

There is one authored circuit. Three difficulties are speeds, not three separate
levels. There is no audio/music synchronization, login, network leaderboard or
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
- src/style.css: responsive arcade page, reduced decorative motion.
- tests/engine.test.mjs: nine tests, including a simulated run that finishes in all modes.

The collision hitbox is slightly inset and axis-aligned even while the square
visually rotates. This is a forgiving gameplay choice. Fixed small simulation
steps prevent narrow obstacles being skipped at higher speed. Long frame gaps are
capped, rather than fast-forwarded; very slow devices may slow gameplay. Frame
visibility pause prevents a hidden page silently advancing.

## Next possible increments

More authored circuits, optional original audio, configurable controls, full
localization and human playtesting for difficulty/accessibility. These are ideas,
not implemented features. Keyboard and DOM controls are available; the animated
canvas does not provide an equivalent screen-reader gameplay experience.

MIT license. See docs/verification.md for observed checks and limits.
