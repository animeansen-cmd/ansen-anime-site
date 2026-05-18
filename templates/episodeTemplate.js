function episodeTemplate(anime, episode) {
  return `
    <html>
      <head>
        <title>${anime.title} - Episódio ${episode.number}</title>
      </head>
      <body>
        <h1>${anime.title} - Episódio ${episode.number}</h1>

        <video controls width="800">
          <source src="${episode.video}" type="video/mp4">
        </video>

        <br><br>
        <a href="../anime/${anime.slug}.html">← Voltar</a>
      </body>
    </html>
  `;
}

module.exports = episodeTemplate;