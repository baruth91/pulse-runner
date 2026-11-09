# Verification

Latest verification: 2026-11-09 (v0.2.0).

- Fifteen deterministic tests passed.
- Static build completed without dependency installation.
- Simulation verifies all three circuits can be completed at all three speeds.
- Every practice checkpoint can restart safely and finish at the fastest speed.
- Tests verify grounded checkpoint acquisition, fresh restart physics, explicit
  full reset, record isolation by level/speed and exclusion of practice results.
- Legacy records migrate only to the unchanged original circuit.
- Browser checks exercised start, pause, resume, Space jump input, P pause input
  and difficulty change. The v0.2 smoke check also exercised circuit selection,
  practice selection, pause/resume, collision results and Space activation of a
  circuit button without starting gameplay. This is not a full human completion run.
- Desktop and narrow layout inspected; no horizontal overflow at the narrow breakpoint.

Tests cover invalid modes, baseline collision, no double jump in midair, paused
state invariance, triangle-edge collision, anti-tunneling substeps, approximate
render-rate independence, completion in each mode and stable end states.

The keyboard/touch handlers share a jump command, but physical touchscreen
acceptance and broad browser/device testing remain pending. Reduced-motion
behavior removes decorative spin/parallax, not the essential moving obstacles.
No claim of full accessibility compliance or professional difficulty balancing.
