# mcw-colors-demo

A small demo of the Minecraft Wiki armor dyeing calculator.

Getting started
---------------

Prerequisites:
- Node.js and npm (tested with Node 18+)

Install dev dependencies:

```powershell
npm install
```

Run the dev server (uses Vite, serving the `src/` folder):

```powershell
npm run dev
```

Open a browser to the URL printed by Vite (usually `http://localhost:5173`).

Inspect `main.ts` objects in the console
-------------------------------------

The code in `src/main.ts` exposes several classes and values on the global `window` object for quick debugging. After opening the app in the browser, open the developer console (F12 or right-click → Inspect → Console) and you can access the objects directly. Example:

```text
// In the browser console
UintData
MakeData
EntriesJE
RecipesJE_Handler
MAX_DYES_PER_CRAFT
colors_je
FUSIONS_JE
mix_je
```

Try evaluating or interacting with them, for example:

```text
// create a handler and add a color
const h = new RecipesJE_Handler();
h.add(colors_je[0]);
// inspect fusions
FUSIONS_JE
```

Build (output to `compiled/`)
---------------------------

To compile the project with TypeScript and produce a standalone `compiled/` folder:

```powershell
npm run build
```

After building, open `compiled/index.html` in a browser (or serve `compiled/` with a static server). The build output uses `tsc` and a small postbuild script copies and tweaks `index.html` and CSS so the compiled `main.js` is loaded.

Notes
-----
- The Vite dev server uses `src/` as its root so `src/index.html` and `src/main.ts` are loaded directly.
- Compiled JS files are emitted to `compiled/` by the TypeScript compiler (`outDir` in `tsconfig.json`).

