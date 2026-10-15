import type { ReactNode } from "react";
import type { FichaProfessor, NumerosDaFicha } from "@/lib/negocios/ficha";
import {
  BandeiraIcon,
  CapelaIcon,
  CarteiraIcon,
  ClienteIcon,
  CrescerIcon,
  EscudoIcon,
  LivroIcon,
  MoedaIcon,
  NumerosIcon,
  PessoasIcon,
  RelogioIcon,
} from "./ficha-icons";

const sectionClass = "rounded-[var(--radius-app)] border border-line bg-paper-raised p-5";
const titleClass = "font-serif text-[17px] font-medium tracking-tight text-petrol";
const textClass = "text-[14.5px] leading-[1.6] text-ink";

function Bloco({ titulo, icone, children }: { titulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <section className={sectionClass}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold">
          {icone}
        </span>
        <h2 className={titleClass}>{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-gold">
      {itens.map((item, i) => (
        <li key={i} className={textClass}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Rotulo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <p className={`${textClass} mb-2 last:mb-0`}>
      <span className="font-semibold text-petrol">{rotulo}:</span> {children}
    </p>
  );
}

function Numero({ rotulo, valor, icone }: { rotulo: string; valor: string; icone: ReactNode }) {
  return (
    <div className="rounded-lg bg-paper px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-gold">
        {icone}
        <p className="font-mono text-[10px] tracking-[0.06em] text-ink-muted uppercase">{rotulo}</p>
      </div>
      <p className="text-[14.5px] font-medium text-ink">{valor}</p>
    </div>
  );
}

const ICONE_PEQUENO = "h-4 w-4";

// Ficha do professor: o conteúdo é o mesmo para qualquer conta (é todo gratuito).
// O que vai abaixo dela (lista, plano) é responsabilidade de quem usa o componente.
export function FichaProfessorView({ ficha, numeros }: { ficha: FichaProfessor; numeros: NumerosDaFicha }) {
  const { preco, comeco, cresce } = ficha;
  const etapas = [
    { quando: "Começo", texto: cresce.c0, destaque: false },
    { quando: "Em 1 ano", texto: cresce.c1, destaque: false },
    { quando: "Em 5 anos", texto: cresce.c5, destaque: true },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <p className="mb-2 text-[17px] leading-[1.55] text-ink">{ficha.vende}</p>

      <Bloco titulo="Para quem é e quando procuram" icone={<PessoasIcon />}>
        <Rotulo rotulo="Quem compra">{ficha.paraQuem}</Rotulo>
        <Rotulo rotulo="Quando procura">{ficha.quando}</Rotulo>
      </Bloco>

      <Bloco titulo="Por que você, professor" icone={<CapelaIcon />}>
        <Lista itens={ficha.porque} />
      </Bloco>

      <Bloco titulo="Em números" icone={<NumerosIcon />}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Numero rotulo="Seu tempo" valor={numeros.horas} icone={<RelogioIcon className={ICONE_PEQUENO} />} />
          <Numero
            rotulo="Investimento para começar"
            valor={numeros.investimento}
            icone={<CarteiraIcon className={ICONE_PEQUENO} />}
          />
          <Numero
            rotulo="Primeiro cliente"
            valor={numeros.primeiroCliente}
            icone={<ClienteIcon className={ICONE_PEQUENO} />}
          />
          <Numero rotulo="Preparo" valor={numeros.preparo} icone={<LivroIcon className={ICONE_PEQUENO} />} />
        </div>
      </Bloco>

      <Bloco titulo="Quanto dá para cobrar" icone={<MoedaIcon />}>
        <p className={`${textClass} mb-2`}>{preco.referencia}</p>
        {preco.aviso ? <p className="mb-2 text-[13px] text-ink-muted">{preco.aviso}</p> : null}
        <p className={`${textClass} mb-2 font-semibold`}>{preco.sugestao}</p>
        {preco.estimativa ? (
          <p className="mb-2 inline-block rounded-md bg-gold-soft px-2.5 py-1 text-[12.5px] text-petrol">
            Estimativa nossa, a validar.
          </p>
        ) : null}
        {preco.conta ? <p className="text-[13px] text-ink-muted">{preco.conta}</p> : null}
      </Bloco>

      <Bloco titulo="O que aprender e preparar antes" icone={<LivroIcon />}>
        <Lista itens={ficha.preparar} />
      </Bloco>

      <Bloco titulo="A melhor forma de começar pequeno" icone={<BandeiraIcon />}>
        <Rotulo rotulo="O que fazer primeiro">{comeco.fazer}</Rotulo>
        <Rotulo rotulo="Como chegar ao primeiro cliente">{comeco.cliente}</Rotulo>
        <Rotulo rotulo="Depois disso">{comeco.depois}</Rotulo>
      </Bloco>

      <Bloco titulo="Como o negócio pode crescer" icone={<CrescerIcon />}>
        {/* Linha do tempo: um trilho com um ponto por etapa; o de 5 anos (o ápice) é maior. */}
        <ol className="ml-2 flex flex-col gap-4 border-l-2 border-gold-soft pl-5">
          {etapas.map(({ quando, texto, destaque }) => (
            <li key={quando} className="relative">
              <span
                className={`absolute top-1 rounded-full bg-gold ${
                  destaque ? "-left-[29px] h-3.5 w-3.5 ring-4 ring-gold-soft" : "-left-[27px] h-2.5 w-2.5"
                }`}
                aria-hidden
              />
              <p className="mb-0.5 font-mono text-[11px] font-semibold tracking-[0.05em] text-gold uppercase">
                {quando}
              </p>
              <p className={textClass}>{texto}</p>
            </li>
          ))}
        </ol>
        <p className={`${textClass} mt-4 rounded-lg bg-gold-soft px-3.5 py-2.5 text-[14px]`}>
          <span className="font-semibold text-petrol">Para não ficar só vendendo o seu tempo:</span> {cresce.alem}
        </p>
        <p className="mt-2.5 text-[12.5px] text-ink-muted">Cenário possível, não previsão nem promessa de renda.</p>
      </Bloco>

      <Bloco titulo="Cuidados antes de vender" icone={<EscudoIcon />}>
        <Lista itens={ficha.cuidados} />
      </Bloco>
    </div>
  );
}
