// Decorative only. Bounded work per frame; never reads or mutates gameplay state.
export function drawAtmosphere(ctx, width, height, time, palette) {
  ctx.save();
  ctx.strokeStyle = palette;
  const glow = ctx.createRadialGradient(
    width * 0.75,
    35,
    0,
    width * 0.75,
    35,
    width * 0.7,
  );
  glow.addColorStop(0, `${palette}22`);
  glow.addColorStop(1, `${palette}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  // Gentle neon breathing, one cycle per six seconds, never full-screen flashes.
  ctx.globalAlpha = 0.1 + 0.05 * Math.sin((time * Math.PI) / 3);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.26);
  ctx.lineTo(width * 0.24, height * 0.12);
  ctx.lineTo(width * 0.48, height * 0.26);
  ctx.lineTo(width * 0.72, height * 0.12);
  ctx.lineTo(width, height * 0.26);
  ctx.stroke();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#9acde8";
  ctx.lineWidth = 1;
  for (let i = 0; i < 52; i++) {
    const x =
      ((((i * 113 - time * 65) % (width + 80)) + width + 80) % (width + 80)) -
      40;
    const y = ((i * 67 + time * (115 + (i % 4) * 18)) % (height + 50)) - 25;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y + 15);
    ctx.stroke();
  }
  // Two short meteor trails, no generated objects accumulating over time.
  for (let i = 0; i < 2; i++) {
    const phase = (time + i * 3.2) % 7;
    if (phase > 1.5) continue;
    const x = width * (0.3 + i * 0.35) + phase * 180;
    const y = -20 + phase * 80;
    ctx.strokeStyle = palette;
    ctx.globalAlpha = 0.3 * Math.sin((phase / 1.5) * Math.PI);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 55, y - 24);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  // A single dim bolt every nine seconds, with one smooth fade, not a strobe.
  const flash = time % 9;
  if (flash < 0.65) {
    const x = width * (0.25 + (Math.floor(time / 9) % 3) * 0.2);
    ctx.globalAlpha = 0.28 * Math.sin((flash / 0.65) * Math.PI);
    ctx.strokeStyle = "#c7c4ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 16, 28);
    ctx.lineTo(x + 5, 27);
    ctx.lineTo(x - 12, 60);
    ctx.stroke();
  }
  ctx.restore();
}
