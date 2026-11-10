import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const types = {
  "/": ["index.html", "text/html"],
  "/style.css": ["style.css", "text/css"],
  "/game.js": ["game.js", "text/javascript"],
  "/engine.js": ["engine.js", "text/javascript"],
  "/records.js": ["records.js", "text/javascript"],
  "/cosmetics.js": ["cosmetics.js", "text/javascript"],
  "/audio.js": ["audio.js", "text/javascript"],
  "/atmosphere.js": ["atmosphere.js", "text/javascript"],
  "/catalog.js": ["catalog.js", "text/javascript"],
  "/catalog-ui.js": ["catalog-ui.js", "text/javascript"],
  "/creator.js": ["creator.js", "text/javascript"],
  "/creator-ui.js": ["creator-ui.js", "text/javascript"],
};
createServer(async (request, response) => {
  const file = types[request.url];
  if (!file) {
    response.writeHead(404).end();
    return;
  }
  try {
    response.writeHead(200, {
      "Content-Type": `${file[1]}; charset=utf-8`,
      "Cache-Control": "no-store",
    });
    response.end(await readFile(`src/${file[0]}`));
  } catch {
    response.writeHead(500).end();
  }
}).listen(8772, "127.0.0.1", () =>
  console.log("Pulse runner: http://127.0.0.1:8772/"),
);
