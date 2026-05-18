function homeTemplate(animes) {
  return `
    <html>
      <head>
        <title>Animes</title>
      </head>
      <body>
        <h1>Lista de Animes</h1>

        <ul>
          ${animes
            .map(
              (anime) => `
            <li>
              <a href="./anime/${anime.slug}.html">
                ${anime.title}
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

module.exports = homeTemplate;
