// Cosmetics never mutate the physics state or collision box.
export const SKINS = [
  {
    id: "pulse",
    name: "Pulse",
    color: "#b9f278",
    ink: "#172211",
    pattern: "eye",
  },
  {
    id: "glacier",
    name: "Glacial",
    color: "#79dfff",
    ink: "#102c40",
    pattern: "diamond",
  },
  {
    id: "nova",
    name: "Nova",
    color: "#d8a0ff",
    ink: "#331547",
    pattern: "cross",
  },
  {
    id: "ember",
    name: "Brasa",
    color: "#ffae79",
    ink: "#452317",
    pattern: "stripes",
  },
];
export function getSkin(id) {
  return SKINS.find((skin) => skin.id === id) || SKINS[0];
}
export function drawSkin(ctx, skin, size = 30) {
  ctx.fillStyle = skin.color;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.strokeStyle = skin.ink;
  ctx.fillStyle = skin.ink;
  ctx.lineWidth = 2;
  const u = size / 30;
  ctx.save();
  ctx.scale(u, u);
  if (skin.pattern === "diamond") {
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.stroke();
  } else if (skin.pattern === "cross") {
    ctx.fillRect(-2, -10, 4, 20);
    ctx.fillRect(-10, -2, 20, 4);
  } else if (skin.pattern === "stripes") {
    ctx.fillRect(-9, -9, 4, 18);
    ctx.fillRect(5, -9, 4, 18);
  } else {
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.fillRect(3, -5, 4, 4);
  }
  ctx.restore();
}
export function createFragments() {
  // A fixed 4×4 breakup keeps allocation bounded and avoids flashing effects.
  return Array.from({ length: 16 }, (_, i) => {
    const col = i % 4,
      row = Math.floor(i / 4);
    return {
      x: (col - 1.5) * 7.5,
      y: (row - 1.5) * 7.5,
      vx: (col - 1.5) * 85,
      vy: -180 + row * 65,
      spin: (i % 2 ? 1 : -1) * (3 + col),
    };
  });
}
