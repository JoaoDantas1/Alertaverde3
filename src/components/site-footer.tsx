import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-gradient-forest text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-sm text-sm text-primary-foreground/75">
            Plataforma comunitária de prevenção e monitoramento de queimadas em Itabirito–MG.
            Juntos pela prevenção, juntos pela vida.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-leaf">Emergência</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-leaf" /> Corpo de Bombeiros: <a href="tel:193" className="font-bold underline">193</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-leaf" /> Defesa Civil: <a href="tel:199" className="font-bold underline">199</a>
            </li>
          </ul>
          <p className="mt-3 text-xs text-primary-foreground/65">
            A denúncia pelo site não substitui a ligação em situações de perigo imediato.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-leaf">Navegação</h2>
          <ul className="space-y-2 text-sm text-primary-foreground/85">
            <li><Link to="/denunciar" className="hover:underline">Denunciar incêndio</Link></li>
            <li><Link to="/mapa" className="hover:underline">Mapa de risco</Link></li>
            <li><Link to="/acompanhar" className="hover:underline">Acompanhar denúncia</Link></li>
            <li><Link to="/prevencao" className="hover:underline">Como prevenir queimadas</Link></li>
            <li><Link to="/equipe" className="hover:underline">Área da equipe</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <p className="container-page py-5 text-xs text-primary-foreground/60">
          Mapa: © colaboradores do OpenStreetMap. Regiões, níveis de risco e históricos do mapa são demonstrativos;
          as denúncias exibidas são registros reais de moradores.
        </p>
      </div>
    </footer>
  );
}
