import {
  defaultSection,
  SLOT_CHOICES,
  compileTrack,
  validateTrack,
  readLibrary,
} from "./creator.js";
import { KIND_NAMES } from "./catalog.js";
const KEY = "pulse-runner-creator-v1";
export function mountCreator(onPlay) {
  let draft = {
      schema: 1,
      title: "Minha primeira pista",
      sections: [defaultSection()],
    },
    editingId = null,
    library = [];
  try {
    library = readLibrary(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    /* Storage optional. */
  }
  const root = document.getElementById("creator-sections"),
    title = document.getElementById("creator-title"),
    message = document.getElementById("creator-message"),
    saved = document.getElementById("creator-saved");
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function action(text, fn, label) {
    const button = element("button", text);
    button.type = "button";
    button.className = "ghost";
    if (label) button.setAttribute("aria-label", label);
    button.onclick = fn;
    return button;
  }
  function getDraft() {
    return validateTrack({ ...draft, title: title.value });
  }
  function refreshLibrary() {
    saved.replaceChildren(new Option("Escolha uma pista salva", ""));
    for (const entry of library) saved.add(new Option(entry.title, entry.id));
    saved.value = editingId || "";
  }
  function preview() {
    try {
      draft.title = title.value;
      const course = compileTrack(getDraft());
      const canvas = document.getElementById("creator-map");
      canvas.width = Math.max(
        240,
        Math.round(canvas.getBoundingClientRect().width) || 900,
      );
      const ctx = canvas.getContext("2d"),
        scale = canvas.width / course.finish;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#101715";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const colors = { jump: "#b9f278", flight: "#79dfff", wave: "#d8a0ff" };
      course.sections.forEach((section, index) => {
        ctx.strokeStyle = colors[section.kind];
        ctx.lineWidth = 2;
        ctx.strokeRect(section.start * scale, 1, 2000 * scale - 1, 108);
        ctx.fillStyle = colors[section.kind];
        ctx.font = "12px system-ui";
        ctx.fillText(
          `${index + 1} · ${KIND_NAMES[section.kind]}`,
          section.start * scale + 8,
          18,
        );
      });
      for (const obstacle of course.obstacles) {
        const x = obstacle.x * scale,
          w = Math.max(3, obstacle.width * scale);
        ctx.fillStyle = obstacle.type === "corridor" ? "#d8a0ff20" : "#ff9b80";
        if (obstacle.type === "corridor") {
          ctx.fillRect(x, 30, w, 8);
          ctx.fillRect(x, 92, w, 8);
        } else if (obstacle.type === "gate") {
          ctx.fillRect(x, 30, w, (300 - obstacle.top) * 0.2);
          ctx.fillRect(x, 96 - obstacle.bottom * 0.2, w, obstacle.bottom * 0.2);
        } else if (obstacle.type === "wave-hazard")
          ctx.fillRect(x, obstacle.side === "floor" ? 83 : 38, w, 12);
        else ctx.fillRect(x, 84, w, 12);
      }
      document.getElementById("creator-duration").textContent =
        `${course.sections.length} trecho(s) · ${course.finish} unidades · cerca de ${Math.round(course.finish / 285)} s no ritmo Pulsante · checkpoints nas transições`;
    } catch (error) {
      message.textContent = error.message;
    }
  }
  function render() {
    root.replaceChildren();
    title.value = draft.title;
    draft.sections.forEach((section, index) => {
      const card = element("div");
      card.className = "creator-section";
      const heading = element("div");
      heading.className = "creator-section-heading";
      heading.append(element("strong", `Trecho ${index + 1}`));
      const up = action(
        "↑",
        () => {
          [draft.sections[index - 1], draft.sections[index]] = [
            draft.sections[index],
            draft.sections[index - 1],
          ];
          render();
        },
        `Subir trecho ${index + 1}`,
      );
      up.disabled = index === 0;
      const remove = action(
        "Remover",
        () => {
          draft.sections.splice(index, 1);
          render();
        },
        `Remover trecho ${index + 1}`,
      );
      remove.disabled = draft.sections.length === 1;
      heading.append(up, remove);
      card.append(heading);
      const label = element("label", "Modalidade "),
        select = element("select");
      select.setAttribute("aria-label", `Modalidade do trecho ${index + 1}`);
      Object.entries(KIND_NAMES).forEach(([kind, name]) =>
        select.add(new Option(name, kind)),
      );
      select.value = section.kind;
      select.onchange = () => {
        draft.sections[index] = {
          ...defaultSection(select.value),
          challenge: section.challenge,
        };
        render();
      };
      label.append(select);
      card.append(label);
      const difficultyLabel = element("label", "Desafio (1–24) "),
        difficulty = element("input");
      difficulty.type = "number";
      difficulty.min = "1";
      difficulty.max = "24";
      difficulty.value = section.challenge;
      difficulty.setAttribute("aria-label", `Desafio do trecho ${index + 1}`);
      difficulty.onchange = () => {
        section.challenge = Number(difficulty.value);
        preview();
      };
      difficultyLabel.append(difficulty);
      card.append(difficultyLabel);
      const slots = element("div");
      slots.className = "creator-slots";
      section.slots.forEach((slot, slotIndex) => {
        const field = element("label", `Posição ${slotIndex + 1} `),
          choice = element("select");
        choice.setAttribute(
          "aria-label",
          `Trecho ${index + 1}, posição ${slotIndex + 1}`,
        );
        Object.entries(SLOT_CHOICES[section.kind]).forEach(([value, text]) =>
          choice.add(new Option(text, value)),
        );
        choice.value = slot;
        choice.onchange = () => {
          section.slots[slotIndex] = choice.value;
          preview();
        };
        field.append(choice);
        slots.append(field);
      });
      card.append(slots);
      root.append(card);
    });
    document.getElementById("creator-add").disabled =
      draft.sections.length >= 3;
    preview();
  }
  title.oninput = () => {
    draft.title = title.value;
    preview();
  };
  document.getElementById("creator-add").onclick = () => {
    draft.sections.push(
      defaultSection(["jump", "flight", "wave"][draft.sections.length]),
    );
    render();
  };
  document.getElementById("creator-new").onclick = () => {
    editingId = null;
    draft = {
      schema: 1,
      title: "Minha nova pista",
      sections: [defaultSection()],
    };
    message.textContent = "Nova pista · ainda não salva";
    refreshLibrary();
    render();
  };
  saved.onchange = () => {
    const entry = library.find((entry) => entry.id === saved.value);
    if (!entry) return;
    editingId = entry.id;
    draft = validateTrack(entry);
    message.textContent = "Pista carregada para editar";
    render();
  };
  document.getElementById("creator-save").onclick = () => {
    try {
      const track = getDraft(),
        id = editingId || `creator-${crypto.randomUUID()}`;
      if (!editingId && library.length >= 12)
        throw new Error(
          "Limite de 12 pistas locais. Exporte sua pista ou edite uma existente.",
        );
      const next = library
        .filter((entry) => entry.id !== id)
        .concat({ id, ...track });
      localStorage.setItem(KEY, JSON.stringify(next));
      library = next;
      editingId = id;
      refreshLibrary();
      message.textContent =
        "Pista salva neste navegador. Exporte o JSON para ter uma cópia.";
    } catch (error) {
      message.textContent = `Não foi possível salvar: ${error.message}`;
    }
  };
  document.getElementById("creator-play").onclick = () => {
    try {
      onPlay(compileTrack(getDraft()));
      message.textContent =
        "Pista pronta para testar abaixo · modo treino, sem recorde";
    } catch (error) {
      message.textContent = error.message;
    }
  };
  document.getElementById("creator-export").onclick = () => {
    try {
      const blob = new Blob([JSON.stringify(getDraft(), null, 2)], {
          type: "application/json",
        }),
        url = URL.createObjectURL(blob),
        link = element("a");
      link.href = url;
      link.download = "pulse-runner-track.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      message.textContent = error.message;
    }
  };
  document.getElementById("creator-import").onchange = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 100000) throw new Error("Arquivo maior que 100 KB.");
      draft = validateTrack(JSON.parse(await file.text()));
      editingId = null;
      refreshLibrary();
      render();
      message.textContent =
        "Pista importada. Teste e salve para guardar neste navegador.";
    } catch (error) {
      message.textContent = `Importação recusada: ${error.message}`;
    } finally {
      event.target.value = "";
    }
  };
  refreshLibrary();
  render();
  new ResizeObserver(preview).observe(document.getElementById("creator-map"));
}
