# Verification

Latest verification: 2026-11-09 (v0.5.0).

- Twenty-four tests passed (15 jumping/records, 6 flight, 3 audio lifecycle).
- Static build completed without dependency installation.
- Simulation verifies all six circuits can be completed at all three speeds.
- Every practice checkpoint can restart safely and finish at the fastest speed.
- Tests verify grounded checkpoint acquisition, fresh restart physics, explicit
  full reset, record isolation by level/speed and exclusion of practice results.
- Legacy records migrate only to the unchanged original circuit.
- Browser checks exercised start, pause, resume, Space jump input, P pause input
  and difficulty change. The v0.2 smoke check also exercised circuit selection,
  practice selection, pause/resume, collision results and Space activation of a
  circuit button without starting gameplay. This is not a full human completion run.
- Desktop and narrow layout inspected; no horizontal overflow at the narrow breakpoint.
- v0.3 browser checks confirmed skin selection survives reload, changing skin
  during gameplay pauses safely, colored fragments appear on collision, and the
  result/retry controls return afterward. Reduced-motion handling was inspected
  in source; an emulated or physical reduced-motion acceptance check is pending.
- v0.4 browser checks confirmed successful audio-context activation through the
  button, volume adjustment, pause/resume, collision with audio enabled, saved
  music/effect/volume preferences and master-off after reload. No console warnings
  or errors were captured in that run. Speaker output and subjective musical
  balance were not audibly verified through the browser automation interface.
- Audio lifecycle tests verify explicit opt-in, independent collision effects,
  mute, stopped voices/timers, bounded volume and paused state after late activation.
- v0.5 flight tests cover gravity, discrete midair impulses, floor/ceiling failure,
  both gate pillars, completion at all three speeds, safe restart from every flight
  checkpoint at the highest speed, and record separation from jumping/practice.
- v0.5 browser checks exercised flight selection, keyboard and pointer impulses,
  pause/resume, failure/retry with impulse count, practice selection, and keyboard
  activation of a circuit button without starting gameplay. Desktop and 390 px
  layout inspected without horizontal overflow. No console warnings/errors captured.
  Full human flight completion, physical touchscreen and difficulty tuning remain pending.

Tests cover invalid modes, baseline collision, no double jump in midair, paused
state invariance, triangle-edge collision, anti-tunneling substeps, approximate
render-rate independence, completion in each mode and stable end states.

The keyboard/touch handlers share a jump command, but physical touchscreen
acceptance and broad browser/device testing remain pending. Reduced-motion
behavior removes decorative spin/parallax, not the essential moving obstacles.
No claim of full accessibility compliance or professional difficulty balancing.
