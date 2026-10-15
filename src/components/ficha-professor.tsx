import type { ReactNode } from "react";
import type { FichaProfessor, NumerosDaFicha } from "@/lib/negocios/ficha";

const sectionClass = "rounded-[var(--radius-app)] border border-line bg-paper-raised p-5";
const titleClass = "mb-2.5 font-serif text-[17px] font-medium tracking-tight text-petrol";
const textClass = "text-[14.5px] leading-[1.6] text-ink";

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>{titulo}</h2>
      {children}
    </section>
  );
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5">
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

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-paper px-3.5 py-2.5">
      <p className="mb-0.5 font-mono text-[10px] tracking-[0.06em] text-ink-muted uppercase">{rotulo}</p>
      <p className="text-[14px] text-ink">{valor}</p>
    </div>
  );
}

// Ficha do professor: o conteúdo é o mesmo para qualquer conta (é todo gratuito).
// O que vai abaixo dela (lista, plano) é responsabilidade de quem usa o componente.
export function FichaProfessorView({ ficha, numeros }: { ficha: FichaProfessor; numeros: NumerosDaFicha }) {
  const { preco, comeco, cresce } = ficha;

  return (
    <div className="flex flex-col gap-3.5">
      <p className="mb-2 text-[17px] leading-[1.55] text-ink">{ficha.vende}</p>

      <Bloco titulo="Para quem é e quando procuram">
        <Rotulo rotulo="Quem compra">{ficha.paraQuem}</Rotulo>
        <Rotulo rotulo="Quando procura">{ficha.quando}</Rotulo>
      </Bloco>

      <Bloco titulo="Por que você, professor">
        <Lista itens={ficha.porque} />
      </Bloco>

      <Bloco titulo="Em números">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Numero rotulo="Seu tempo" valor={numeros.horas} />
          <Numero rotulo="Para começar" valor={numeros.investimento} />
          <Numero rotulo="Primeiro cliente" valor={numeros.primeiroCliente} />
          <Numero rotulo="Preparo" valor={numeros.preparo} />
        </div>
      </Bloco>

      <Bloco titulo="Quanto dá para cobrar">
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

      <Bloco titulo="O que aprender e preparar antes">
        <Lista itens={ficha.preparar} />
      </Bloco>

      <Bloco titulo="A melhor forma de começar pequeno">
        <Rotulo rotulo="O que fazer primeiro">{comeco.fazer}</Rotulo>
        <Rotulo rotulo="Como chegar ao primeiro cliente">{comeco.cliente}</Rotulo>
        <Rotulo rotulo="Depois disso">{comeco.depois}</Rotulo>
      </Bloco>

      <Bloco titulo="Como o negócio pode crescer">
        <div className="flex flex-col gap-3">
          {[
            ["Começo", cresce.c0],
            ["Em 1 ano", cresce.c1],
            ["Em 5 anos", cresce.c5],
          ].map(([quando, texto]) => (
            <div key={quando} className="grid grid-cols-1 gap-0.5 sm:grid-cols-[88px_1fr] sm:gap-3">
              <p className="pt-0.5 font-mono text-[11px] font-semibold tracking-[0.05em] text-gold uppercase">{quando}</p>
              <p className={textClass}>{texto}</p>
            </div>
          ))}
        </div>
        <p className={`${textClass} mt-4 rounded-lg bg-gold-soft px-3.5 py-2.5 text-[14px]`}>
          <span className="font-semibold text-petrol">Para não ficar só vendendo o seu tempo:</span> {cresce.alem}
        </p>
        <p className="mt-2.5 text-[12.5px] text-ink-muted">Cenário possível, não previsão nem promessa de renda.</p>
      </Bloco>

      <Bloco titulo="Cuidados antes de vender">
        <Lista itens={ficha.cuidados} />
      </Bloco>
    </div>
  );
}
