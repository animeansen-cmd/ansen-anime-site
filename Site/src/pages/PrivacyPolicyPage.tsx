import { Shield } from "lucide-react";

const PrivacyPolicyPage = () => {
  return (
    <div className="container py-24 pb-20 md:pb-8 max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Shield size={24} />
        </div>
        <h1 className="font-heading text-3xl font-black">Política de Privacidade</h1>
      </div>

      <div className="glass rounded-2xl border border-border p-6 md:p-10 space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">1. Isenção de Responsabilidade sobre Hospedagem de Conteúdo</h2>
          <p>
            O <strong>Ansen Animes</strong> é um motor de busca e indexador de conteúdo. Nós <strong>NÃO hospedamos, NÃO fazemos upload e NÃO armazenamos</strong> nenhum tipo de arquivo de vídeo, mídia ou arquivos protegidos por direitos autorais em nossos servidores.
          </p>
          <p>
            Todo o conteúdo exibido (vídeos, episódios e filmes) é provido por plataformas e servidores de terceiros não afiliados ao nosso site (como Blogger, Google Drive, entre outros). O Ansen Animes apenas organiza e compartilha links encontrados publicamente na internet, funcionando de maneira semelhante a motores de busca como o Google.
          </p>
          <p>
            Qualquer reivindicação de direitos autorais deve ser direcionada diretamente aos provedores de hospedagem responsáveis pelos arquivos.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">2. Coleta e Uso de Dados</h2>
          <p>
            Quando você cria uma conta em nossa plataforma utilizando o Google (Google OAuth) ou e-mail, nós coletamos e armazenamos apenas as informações estritamente necessárias para o funcionamento do seu perfil:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Nome e Foto de Perfil:</strong> Utilizados exclusivamente para exibição na interface do site.</li>
            <li><strong>Endereço de E-mail:</strong> Utilizado como identificador único para o login seguro e recuperação de conta.</li>
            <li><strong>Favoritos:</strong> Os animes e filmes que você marca como favoritos são armazenados em nosso banco de dados (provido pelo Supabase) para que você não perca seu progresso ao trocar de dispositivo.</li>
          </ul>
          <p>
            Nós <strong>não compartilhamos, vendemos ou distribuímos</strong> seus dados pessoais com terceiros sob nenhuma circunstância.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">3. Tecnologias de Terceiros e Cookies</h2>
          <p>
            Utilizamos as seguintes tecnologias de terceiros para melhorar a sua experiência e manter a infraestrutura do site:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Supabase:</strong> Responsável por gerenciar o banco de dados seguro e o sistema de autenticação (Login).</li>
            <li><strong>Serviços de Análise e Monetização:</strong> Podemos utilizar cookies não identificáveis pessoalmente para entender o tráfego do site e viabilizar a manutenção da plataforma.</li>
            <li><strong>Cookies Locais:</strong> Usamos o armazenamento do seu navegador (Local Storage) para salvar preferências de tema ou volume do player de vídeo.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">4. Alterações nesta Política</h2>
          <p>
            O Ansen Animes reserva-se o direito de atualizar ou modificar esta Política de Privacidade a qualquer momento. Caso ocorram mudanças significativas, notificaremos os usuários cadastrados através da plataforma.
          </p>
          <p>
            Ao continuar utilizando os serviços do Ansen Animes, você concorda automaticamente com os termos estabelecidos nesta Política de Privacidade.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
