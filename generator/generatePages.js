const fs = require("fs-extra");
const path = require("path");

const homeTemplate = require("../templates/homeTemplate");
const animeTemplate = require("../templates/animeTemplate");
const episodeTemplate = require("../templates/episodeTemplate");

async function main() {
  try {
    const publicDir = path.join(__dirname, "../public");
    const animeDir = path.join(publicDir, "anime");
    const episodeDir = path.join(publicDir, "episodio");

    // 🔥 NOVA FONTE (Firestore exportado)
    const dataPath = path.join(__dirname, "../data/animesFull.json");

    if (!(await fs.pathExists(dataPath))) {
      console.log("❌ animesFull.json não encontrado");
      return;
    }

    let animes = await fs.readJson(dataPath);

    // 🔥 remove animes inválidos
    animes = animes.filter(a => a.slug && a.title);

    // 🔥 ordena por mais recentes (opcional mas top)
    animes.sort((a, b) => {
      return (b.episodes?.length || 0) - (a.episodes?.length || 0);
    });

    // 💣 limpa tudo antes (retry pra contornar EBUSY no Windows)
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await fs.remove(publicDir);
        break;
      } catch (err) {
        if (err.code === "EBUSY" && attempt < 5) {
          console.log(`⏳ Arquivo travado, aguardando... (tentativa ${attempt}/5)`);
          await new Promise(r => setTimeout(r, 1500 * attempt));
        } else {
          throw err;
        }
      }
    }

    // 💣 recria estrutura
    await fs.ensureDir(publicDir);
    await fs.ensureDir(animeDir);
    await fs.ensureDir(episodeDir);


    // 🏠 HOME
    console.log("🏠 Gerando home...");
    const homeHtml = homeTemplate(animes);

    await fs.writeFile(
      path.join(publicDir, "index.html"),
      homeHtml
    );

    // 🎬 ANIMES + EPISÓDIOS
    for (const anime of animes) {
      console.log("🎬 Gerando anime:", anime.title);

      // 🔥 garante episódios válidos
      const validEpisodes = (anime.episodes || []).filter(ep => ep.video);

      // página do anime
      const animeHtml = animeTemplate({
        ...anime,
        episodes: validEpisodes
      });

      await fs.writeFile(
        path.join(animeDir, `${anime.slug}.html`),
        animeHtml
      );

      // episódios
      for (const ep of validEpisodes) {
        if (!ep.number || !ep.video) continue;

        const epHtml = episodeTemplate(anime, ep);

        await fs.writeFile(
          path.join(
            episodeDir,
            `${anime.slug}-${ep.number}.html`
          ),
          epHtml
        );
      }
    }

    console.log("\n🚀 Site gerado com sucesso!");
  } catch (err) {
    console.log("❌ Erro ao gerar páginas:", err.message);
  }
}

main();