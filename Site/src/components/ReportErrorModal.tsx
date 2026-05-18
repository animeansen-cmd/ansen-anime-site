import { X } from "lucide-react";

interface ReportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeTitle: string;
  episodeNumber: number;
}

const ReportErrorModal = ({ isOpen, onClose, animeTitle, episodeNumber }: ReportErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-lg overflow-hidden relative">
        <div className="p-4 flex items-start justify-between border-b border-border">
          <p className="text-sm text-muted-foreground pr-4">
            Utilize o campo abaixo ou envie um email para <strong className="text-foreground">animeansen@gmail.com</strong>
          </p>
          <button onClick={onClose} className="text-primary hover:text-primary/80 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form action="https://formsubmit.co/animeansen@gmail.com" method="POST" className="p-6 space-y-4">
          <input type="hidden" name="_subject" value={`Erro reportado: ${animeTitle} - Episódio ${episodeNumber}`} />
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="Anime" value={animeTitle} />
          <input type="hidden" name="Episódio" value={episodeNumber} />

          <div className="space-y-3">
            {[
              { id: "wrong_ep", label: "Episódio errado", desc: "O episódio está errado ou fora de ordem" },
              { id: "bad_image", label: "Qualidade da Imagem", desc: "Imagem do vídeo está ruim" },
              { id: "bad_sound", label: "Problema no Som", desc: "O audio está fora de sincronia" },
              { id: "wrong_subs", label: "Legendas erradas", desc: "A legenda está apresentando erros" },
              { id: "slow_load", label: "Carregamento lento", desc: "O vídeo esta demorando para carregar" },
            ].map((issue) => (
              <label key={issue.id} className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-1 flex-shrink-0">
                  <input type="checkbox" name="Problemas" value={issue.label} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">{issue.label}</p>
                  <p className="text-xs text-muted-foreground">{issue.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-2">
            <textarea
              name="Descrição"
              rows={3}
              placeholder="Por favor descreva o problema encontrado"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            ></textarea>
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="adicione seu email nesse campo"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-semibold py-3 transition-colors"
            >
              Enviar Mensagem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportErrorModal;
