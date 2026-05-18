function animeTemplate(anime) {
  return `
    <html>
      <head>
        <title>${anime.title}</title>
      </head>
      <body>
        <a href="../index.html">Voltar para a home</a>
        <h1>${anime.title}</h1>
        <p>${anime.description}</p>

        <h2>Episodios</h2>
        <ul>
          ${(anime.episodes || [])
            .map(
              (ep) => `
            <li>
              <a href="../episodio/${anime.slug}-${ep.number}.html">
                Episodio ${ep.number}: ${ep.title}
              </a>
            </li>
          `
            )
            .join("")}
        </ul>
      </body>
    </html>
  `;
}

module.exports = animeTemplate;
