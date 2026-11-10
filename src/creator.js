import { makeCourse, makeHazard } from "./catalog.js";
export const SLOT_CHOICES = {
  jump: {
    none: "Vazio",
    spike: "Ponta",
    block: "Bloco",
    double: "Duas pontas",
  },
  flight: {
    none: "Vazio",
    low: "Portal baixo",
    middle: "Portal central",
    high: "Portal alto",
  },
  wave: { none: "Vazio", floor: "Ponta no chão", ceiling: "Ponta no teto" },
};
export function defaultSection(kind = "jump") {
  return {
    kind,
    challenge: 8,
    slots:
      kind === "jump"
        ? ["spike", "block", "double", "spike"]
        : kind === "flight"
          ? ["middle", "high", "low", "middle"]
          : ["ceiling", "floor", "ceiling", "floor"],
  };
}
export function validateTrack(value) {
  if (
    !value ||
    value.schema !== 1 ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.length > 60 ||
    !Array.isArray(value.sections) ||
    value.sections.length < 1 ||
    value.sections.length > 3
  )
    throw new Error("Use um nome de até 60 caracteres e de 1 a 3 trechos.");
  return {
    schema: 1,
    title: value.title.trim(),
    sections: value.sections.map((section) => {
      if (
        !section ||
        !Object.hasOwn(SLOT_CHOICES, section.kind) ||
        !Number.isInteger(section.challenge) ||
        section.challenge < 1 ||
        section.challenge > 24 ||
        !Array.isArray(section.slots) ||
        section.slots.length !== 4 ||
        section.slots.some(
          (slot) => !Object.hasOwn(SLOT_CHOICES[section.kind], slot),
        )
      )
        throw new Error(
          "Trecho inválido: escolha modalidade, desafio 1–24 e quatro posições válidas.",
        );
      return {
        kind: section.kind,
        challenge: section.challenge,
        slots: [...section.slots],
      };
    }),
  };
}
export function compileTrack(value, id = "creator-preview") {
  const track = validateTrack(value);
  const sections = track.sections.map((section, index) => ({
    ...section,
    start: index * 2000,
    end: (index + 1) * 2000,
  }));
  const obstacles = sections.flatMap((section, sectionIndex) => {
    const walls =
      section.kind === "wave"
        ? makeCourse("wave", section.challenge, 2000).filter(
            (item) => item.type === "corridor",
          )
        : [];
    const items = [...walls];
    section.slots.forEach((slot, index) => {
      const x = 500 + index * 400;
      if (slot === "none") return;
      if (section.kind === "jump") {
        items.push({
          x,
          type: slot === "block" ? "block" : "spike",
          width: slot === "block" ? 42 : 32,
          height:
            slot === "block"
              ? 42 + section.challenge * 0.7
              : 36 + section.challenge * 0.6,
        });
        if (slot === "double")
          items.push({
            x: x + 34,
            type: "spike",
            width: 32,
            height: 36 + section.challenge * 0.6,
          });
      } else if (section.kind === "flight") {
        const center = slot === "low" ? 125 : slot === "high" ? 175 : 150;
        const gap = 164 - section.challenge * 1.8;
        items.push({
          x,
          type: "gate",
          width: 64,
          height: 300,
          bottom: center - gap / 2,
          top: center + gap / 2,
        });
      } else items.push(makeHazard(walls, x, slot));
    });
    return items.map((item) => ({
      ...item,
      x: item.x + section.start,
      section: sectionIndex,
    }));
  });
  return {
    id,
    name: track.title,
    number: "C",
    kind: sections[0].kind,
    finish: sections.length * 2000,
    description: `Creator · ${sections.length} trecho(s) · transições em checkpoints`,
    custom: true,
    sections,
    obstacles,
  };
}
export function readLibrary(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).flatMap((entry) => {
    try {
      if (
        typeof entry.id !== "string" ||
        !/^creator-[a-zA-Z0-9-]{1,70}$/.test(entry.id)
      )
        return [];
      return [{ id: entry.id, ...validateTrack(entry) }];
    } catch {
      return [];
    }
  });
}
