# Build a short custom track

1. Click **Abrir Creator** above the course catalog.
2. Give the track a name. Start with one section and use **Adicionar trecho**
   to append a second or third section.
3. Choose Salto, Voo or Wave independently for each section. Use the up arrow
   to reorder sections; Remove keeps at least one section in the track.
4. Set challenge 1–24. In Salto this changes obstacle height; in Voo it changes
   opening size; in Wave it changes corridor width and geometry.
5. Configure the four positions in each section. Salto offers spikes, blocks and
   double spikes. Voo offers low, middle or high gates. Wave offers floor/ceiling
   hazards. Any position may be empty.
6. Inspect the sequence map, then click **Testar pista**. Choose a speed and start
   the game below. Creator runs in practice mode, without ranked records.
7. At each section boundary, the mode changes automatically and vertical state
   resets to a safe spawn. In practice this boundary becomes the retry checkpoint.
   Flight requires repeated impulses; Wave keeps its click-toggle adhesion.
8. Use **Salvar pista**. The success message confirms the local write. Choose a
   saved name in Minhas pistas to load and edit it, then Save updates that track.
9. Use **Exportar JSON** to download a backup. **Importar JSON** loads a valid
   file into the editor; save it explicitly to add it to this browser's library.

Each section is 2,000 units long and offers four fixed positions, at 500, 900,
1,300 and 1,700 units. Three sections total 6,000 units, approximately 21 seconds
at Pulsante speed. The editor deliberately limits duration and obstacle density.
It supports layout composition rather than pixel-by-pixel painting.

The library holds up to 12 tracks per browser origin. Export before moving to
another browser, clearing site data or changing the site URL. A saved track does
not require a server account. The imported file never executes code: only the
supported fields are normalized by the schema validator.

## Track format

```json
{
  "schema": 1,
  "title": "A short mixed track",
  "sections": [
    {
      "kind": "jump",
      "challenge": 8,
      "slots": ["spike", "block", "none", "double"]
    },
    {
      "kind": "flight",
      "challenge": 8,
      "slots": ["middle", "high", "low", "middle"]
    },
    {
      "kind": "wave",
      "challenge": 8,
      "slots": ["ceiling", "floor", "ceiling", "floor"]
    }
  ]
}
```

Validation enforces version 1, a nonempty title of at most 60 characters, one to
three sections, integer challenge 1–24 and exactly four valid slots per section.
Files larger than 100 KB are rejected by the UI. The compiler tags every obstacle
with its section; only the active section participates in collision or rendering.

The catalog uses deterministic layouts. The Creator allows choices that have not
all been balanced together, so test your track before sharing it. Start with an
empty introductory section, add a few obstacles, then increase speed or challenge.
