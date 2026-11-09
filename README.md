# Pulse runner

An original one-button geometric arcade game for modern browsers. Jump over a
fixed sequence of spikes and blocks, fly between gates with timed impulses, or
switch between rideable ceiling and floor surfaces in Wave mode.
Learn the timing and reach the finish line.
Canvas 2D art, physics and interface are implemented without runtime dependencies.

## Play

- Space, Up arrow, left click or touch on the game canvas: jump.
- P: pause/resume. R: restart (from the checkpoint when practicing).
- Choose one of nine authored circuits, then Tranquilo, Pulsante or Intenso.
- Circuits 01–03 use grounded jumps. Circuits 04–06 use flight: each press/click/
  touch gives an upward impulse, including in midair; gravity brings you down.
  Repeated discrete inputs are required. Holding a key does not repeat impulses.
  Avoid both pillars of each gate, the floor and ceiling.
- Flight courses progress from wide openings (Primeiro voo), through alternating
  heights (Ondas no céu), to narrower openings (Voo de precisão).
- Circuits 07–09 use click-toggle Wave. Start toward the ceiling; every press,
  click or touch switches the destination between ceiling and floor. There is
  no gravity. On reaching a surface, the character sticks and slides along it
  until the next input. Both surfaces are safe, including sloped sections.
  Separate coral-colored spikes are lethal and alternate between surfaces.
  Holding a key does not repeat toggles. A colored trail shows your path.
- Wave practice resumes at the corridor center with a fresh direction. Records
  remain separated by circuit and speed, and practice never sets a ranked best.
- Fundo animado enables rain, meteor trails, dim lightning and slow neon breathing
  across all nine circuits. It saves its setting locally, freezes when paused,
  and turns off with reduced-motion preference. Reduced motion also removes the
  Wave trail. Lightning is a small smooth-fading bolt every nine seconds, not a
  full-screen flash. Weather effects are visual and do not affect collision.
- Enable practice to unlock safe checkpoints as you advance on the ground.
  Retry from the last checkpoint, or choose Do início to reset the whole run.
  Checkpoints last only for the current session and reset when changing options.
  In flight, checkpoints are acquired between gates while airborne. Retry restores
  a safe height with zero vertical speed; continue tapping to maintain flight.
- The game pauses when the page is hidden. Start again with Continue.
- Choose Pulse, Glacial, Nova or Brasa in the skin selector. Each has an original
  color and pattern; all share the same collision box and jump physics. Selecting
  a skin during a run pauses it. The choice is saved locally when storage works.
- On collision, the character breaks into 16 colored fragments before the result
  appears. Reduced-motion preference disables the breakup and its short delay.
- Click Ativar som to enable the original 128 BPM electronic synth loop and
  collision sound. Music and impact effects can be switched separately; volume
  and these preferences are saved locally. Audio starts disabled after reload.
  Music plays only during a run; pause, hidden page and results stop the loop.
- Best percentage is stored locally per circuit and difficulty, when storage is available.
  Practice never updates ranked bests. Original-circuit bests migrate from v0.1.

There are nine circuits with different obstacle sequences and three speeds each.
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
- src/audio.js: Web Audio synthesis, look-ahead sequencer and voice cleanup.
- src/atmosphere.js: bounded decorative rain, meteors, lightning and neon.
- src/style.css: responsive arcade page, reduced decorative motion.
- tests/engine.test.mjs: 15 tests, including all circuits at every speed and checkpoint recovery.
- tests/audio.test.mjs: 3 lifecycle tests for opt-in, pause cleanup, mute, effects
  independence and late activation. These use an audio-context double, not speakers.
- tests/flight.test.mjs: 6 tests covering midair impulses, floor/ceiling and gate
  collision, completion at each speed, practice recovery and record separation.
- tests/wave.test.mjs: 8 tests for toggles, adhesion and surface sliding, obstacle
  collision, completion at each speed, checkpoint recovery, render rates and records.

The soundtrack combines synthesized kick, snare, hats, bass and a melodic minor
progression. No recordings or external music services are used. A short look-ahead
scheduler uses the audio clock; physics remains independent, so beats are atmosphere,
not jump cues. Audio requires browser Web Audio support and a user gesture. If it
cannot start, the game remains playable without sound.

The collision hitbox is slightly inset and axis-aligned even while the square
visually rotates. This is a forgiving gameplay choice. Fixed small simulation
steps prevent narrow obstacles being skipped at higher speed. Long frame gaps are
capped, rather than fast-forwarded; very slow devices may slow gameplay. Frame
visibility pause prevents a hidden page silently advancing.

Flight has its own gravity and impulse strength. Its arena is 300 logical units
high, scaled vertically to the canvas so a smaller screen never changes collision
geometry or available flight space. Gate openings and difficulty are authored,
not random. Simulated completion demonstrates feasibility, not human balancing.
Wave shares that fixed arena but uses linear movement with a constant diagonal
slope. Surface contact clamps the square into the corridor without ending the
run; hazards use triangle collision. The soundtrack remains independent of input.

## Next possible increments

Configurable controls, full
localization and human playtesting for difficulty/accessibility. These are ideas,
not implemented features. Keyboard and DOM controls are available; the animated
canvas does not provide an equivalent screen-reader gameplay experience.

MIT license. See docs/verification.md for observed checks and limits.
