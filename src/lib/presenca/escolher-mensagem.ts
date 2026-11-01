import type { SituacaoDePresenca } from "./dias";
import {
  LIMIARES_SEGUIDOS,
  MARCOS_TOTAIS,
  MENSAGENS_MARCOS,
  MENSAGENS_PRIMEIRA,
  MENSAGENS_RETORNO,
  MENSAGENS_SEGUIDOS,
  type FaixaDeRetorno,
  type Mensagem,
} from "./mensagens";

// Só 3 dias ou mais sem marcar presença contam como "volta": faltar um ou dois dias é normal
// e não merece mensagem.
export function faixaDeRetorno(diasAusente: number | null): FaixaDeRetorno | null {
  if (diasAusente === null || diasAusente < 3) return null;
  if (diasAusente < 7) return "curto";
  if (diasAusente < 14) return "semana";
  if (diasAusente < 30) return "quinzena";
  return "mes";
}

// Que conjunto de mensagens vale hoje. Prioridade: primeira presença, marco do contador,
// volta depois de um tempo e dias seguidos. Na maioria dos dias não há nenhum (null): a
// mensagem só aparece quando há algo a reconhecer.
export function conjuntoDeMensagens(sit: SituacaoDePresenca): Mensagem[] | null {
  if (sit.total === 1) return MENSAGENS_PRIMEIRA;

  if ((MARCOS_TOTAIS as readonly number[]).includes(sit.total)) return MENSAGENS_MARCOS[sit.total];

  const retorno = faixaDeRetorno(sit.diasAusente);
  if (retorno) return MENSAGENS_RETORNO[retorno];

  // Passado de 30 seguidos, repete a mensagem de 30 a cada 30 dias (60, 90, 120...).
  if (sit.seguidos > 30 && sit.seguidos % 30 === 0) return MENSAGENS_SEGUIDOS[30];
  if ((LIMIARES_SEGUIDOS as readonly number[]).includes(sit.seguidos)) return MENSAGENS_SEGUIDOS[sit.seguidos];

  return null;
}

export function preencherMensagem(
  texto: string,
  dados: { nome?: string | null; dias: number; seguidos: number; proxima?: string | null },
): string {
  const nome = dados.nome?.trim().split(/\s+/)[0] ?? "";
  let resultado = texto;
  if (nome) {
    resultado = resultado.replaceAll("{nome}", nome);
  } else {
    // Sem nome, tira o marcador junto com a vírgula e arruma a maiúscula do começo.
    resultado = resultado.replace(/,\s*\{nome\}/g, "").replace(/\{nome\},\s*/g, "");
    resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
  }
  return resultado
    .replaceAll("{dias}", String(dados.dias))
    .replaceAll("{seguidos}", String(dados.seguidos))
    .replaceAll("{proxima}", dados.proxima ? `"${dados.proxima}"` : "");
}

export type MensagemEscolhida = { id: string; texto: string };

// `sorteio` é um número de 0 a 1 (injetável para os testes). Nunca repete `anteriorId` se
// houver outra opção, e só usa versões com {proxima} quando a pessoa tem uma próxima ação.
export function escolherMensagem(
  sit: SituacaoDePresenca,
  opcoes: {
    nome?: string | null;
    proxima?: string | null;
    anteriorId?: string | null;
    sorteio?: number;
  },
): MensagemEscolhida | null {
  const conjunto = conjuntoDeMensagens(sit);
  if (!conjunto) return null;

  let candidatas = conjunto.filter((m) => !m.usaProxima || opcoes.proxima);
  if (candidatas.length === 0) candidatas = conjunto.filter((m) => !m.usaProxima);
  const semRepetir = candidatas.filter((m) => m.id !== opcoes.anteriorId);
  if (semRepetir.length > 0) candidatas = semRepetir;

  const sorteio = opcoes.sorteio ?? Math.random();
  const escolhida = candidatas[Math.min(candidatas.length - 1, Math.floor(sorteio * candidatas.length))];
  return {
    id: escolhida.id,
    texto: preencherMensagem(escolhida.texto, {
      nome: opcoes.nome,
      dias: sit.total,
      seguidos: sit.seguidos,
      proxima: opcoes.proxima,
    }),
  };
}

// Para reexibir a mensagem do dia a partir do id guardado (a página recarrega e a mensagem
// tem que continuar a mesma).
export function mensagemPorId(id: string | null | undefined): Mensagem | null {
  if (!id) return null;
  const todas: Mensagem[] = [
    ...MENSAGENS_PRIMEIRA,
    ...Object.values(MENSAGENS_SEGUIDOS).flat(),
    ...Object.values(MENSAGENS_RETORNO).flat(),
    ...Object.values(MENSAGENS_MARCOS).flat(),
  ];
  return todas.find((m) => m.id === id) ?? null;
}
