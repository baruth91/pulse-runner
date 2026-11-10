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
  { id: "hex", name: "Hexa", color: "#7fffd4", ink: "#153d37", shape: 6 },
  { id: "prism", name: "Prisma", color: "#ff91ce", ink: "#481c38", shape: 3 },
  {
    id: "orbit",
    name: "Órbita",
    color: "#ffe580",
    ink: "#443a14",
    shape: "circle",
  },
  { id: "pentagon", name: "Penta", color: "#a5acff", ink: "#242957", shape: 5 },
  { id: "octagon", name: "Octa", color: "#ff7979", ink: "#481d1d", shape: 8 },
  {
    id: "star",
    name: "Estrela",
    color: "#f2c0ff",
    ink: "#3d1e46",
    shape: "star",
  },
  { id: "kite", name: "Cometa", color: "#75ddff", ink: "#133b49", shape: 4 },
  { id: "ring", name: "Anel", color: "#e0ffad", ink: "#30451b", shape: "ring" },
];
export function getSkin(id) {
  return SKINS.find((skin) => skin.id === id) || SKINS[0];
}
export function drawSkin(ctx, skin, size = 30) {
  if (skin.shape) {
    ctx.save();
    ctx.scale(size / 30, size / 30);
    ctx.fillStyle = skin.color;
    ctx.strokeStyle = skin.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (skin.shape === "circle" || skin.shape === "ring")
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
    else {
      const count = skin.shape === "star" ? 10 : skin.shape;
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI * 2) / count;
        const radius = skin.shape === "star" && i % 2 ? 8 : 15;
        if (i === 0)
          ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = skin.ink;
    ctx.beginPath();
    ctx.arc(0, 0, skin.shape === "ring" ? 9 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
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
