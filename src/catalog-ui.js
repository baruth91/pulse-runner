import { LEVELS, levelKind } from "./engine.js";
export function mountCatalog(onSelect, selected, score) {
  let page = 0;
  const kind = document.getElementById("catalog-kind"),
    tier = document.getElementById("catalog-tier"),
    root = document.getElementById("level-buttons");
  function render() {
    const all = LEVELS.filter((level) => levelKind(level.id) === kind.value);
    const list = all.filter(
      (_, index) =>
        tier.value === "all" || Math.floor(index / 8) === Number(tier.value),
    );
    page = Math.max(0, Math.min(page, Math.ceil(list.length / 6) - 1));
    root.replaceChildren();
    for (const level of list.slice(page * 6, page * 6 + 6)) {
      const rank = all.indexOf(level) + 1,
        button = document.createElement("button");
      button.dataset.level = level.id;
      button.setAttribute("aria-pressed", String(selected() === level.id));
      const caption = document.createElement("span");
      caption.textContent = `${String(rank).padStart(2, "0")} / 24 · ${rank <= 8 ? "INICIAL" : rank <= 16 ? "AVANÇADO" : "ESPECIALISTA"}`;
      const name = document.createElement("strong");
      name.textContent = level.name;
      const description = document.createElement("small");
      description.textContent = level.description;
      const best = document.createElement("span");
      best.className = "level-best";
      best.id = `best-${level.id}`;
      best.textContent = `Melhor: ${score(level.id)}%`;
      button.append(caption, name, description, best);
      button.onclick = () => onSelect(level.id);
      root.append(button);
    }
    document.getElementById("catalog-page").textContent =
      `${list.length} fases · página ${page + 1} de ${Math.ceil(list.length / 6)}`;
    document.getElementById("catalog-prev").disabled = page === 0;
    document.getElementById("catalog-next").disabled =
      (page + 1) * 6 >= list.length;
  }
  kind.onchange = tier.onchange = () => {
    page = 0;
    render();
  };
  document.getElementById("catalog-prev").onclick = () => {
    page--;
    render();
  };
  document.getElementById("catalog-next").onclick = () => {
    page++;
    render();
  };
  render();
  return render;
}
