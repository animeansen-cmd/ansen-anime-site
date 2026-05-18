// scripts/minifyData.js
// Minifica os arquivos JSON de dados após o build do Vite.
// Reduz ~30% do tamanho, acelerando o primeiro carregamento sem cache.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DATA = join(__dirname, "../dist/data");

const FILES = [
  "animesFull.json",
  "filmesFull.json",
  "latestEpisodes.json",
];

let totalSaved = 0;

for (const filename of FILES) {
  const filePath = join(DIST_DATA, filename);

  if (!existsSync(filePath)) {
    console.log(`[minifyData] Pulando ${filename} (não encontrado em dist/)`);
    continue;
  }

  const original = readFileSync(filePath, "utf-8");
  const originalSize = Buffer.byteLength(original, "utf-8");

  // JSON.parse + JSON.stringify sem indentação = minificação
  const minified = JSON.stringify(JSON.parse(original));
  const minifiedSize = Buffer.byteLength(minified, "utf-8");
  const saved = originalSize - minifiedSize;
  totalSaved += saved;

  writeFileSync(filePath, minified, "utf-8");

  console.log(
    `[minifyData] ${filename}: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(minifiedSize / 1024 / 1024).toFixed(2)} MB (-${((saved / originalSize) * 100).toFixed(1)}%)`
  );
}

console.log(
  `[minifyData] Total economizado: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`
);
