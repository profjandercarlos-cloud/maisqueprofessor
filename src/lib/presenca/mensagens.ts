// Mensagens curtas que o app mostra depois de "Presente", só em momentos especiais (não todo
// dia): primeira presença, dias seguidos, volta depois de um tempo e marcos do contador.
// Nenhuma cobra nada: só reconhece. Marcadores: {nome}, {dias} (total de presenças),
// {seguidos} e {proxima} (a próxima ação do plano). Sem gênero e sem travessão.
// Cada situação tem várias versões para o app não repetir a mesma duas vezes seguidas.
export type Mensagem = { id: string; texto: string; usaProxima?: boolean };

export const MENSAGENS_PRIMEIRA: Mensagem[] = [
  { id: "p-1", texto: "Que bom ter você aqui, {nome}. Este é o seu primeiro dia de compromisso com o plano." },
  { id: "p-2", texto: "{nome}, o seu primeiro Presente está registrado. O resto do caminho se faz um dia de cada vez." },
  { id: "p-3", texto: "Primeiro dia marcado. A partir daqui, o número só cresce." },
];

export const LIMIARES_SEGUIDOS = [2, 3, 5, 7, 10, 14, 21, 30] as const;

export const MENSAGENS_SEGUIDOS: Record<number, Mensagem[]> = {
  2: [
    { id: "s2-1", texto: "Ontem e hoje, {nome}. Dois dias já são o começo de uma rotina." },
    { id: "s2-2", texto: "Dois dias seguidos. Um passo em cima do outro." },
    { id: "s2-3", texto: "Você voltou hoje também. É assim que um hábito começa a se formar." },
  ],
  3: [
    { id: "s3-1", texto: "Três dias seguidos, {nome}. A rotina está ganhando forma." },
    { id: "s3-2", texto: "Ontem, anteontem e hoje. Três presenças seguidas dizem muito sobre o seu compromisso." },
    { id: "s3-3", texto: "Três dias em sequência. Continue no seu ritmo." },
  ],
  5: [
    { id: "s5-1", texto: "Cinco dias seguidos. Isso é persistência, e é ela que sustenta quem executa." },
    { id: "s5-2", texto: "{nome}, você apareceu cinco dias em sequência. O seu plano percebe." },
    { id: "s5-3", texto: "Cinco dias seguidos já formam uma semana de trabalho. Que bom ter você aqui." },
  ],
  7: [
    { id: "s7-1", texto: "Sete dias seguidos, {nome}. Uma semana inteira de compromisso." },
    { id: "s7-2", texto: "Uma semana sem faltar. Isso mostra que você consegue manter uma rotina." },
    { id: "s7-3", texto: "Sete presenças seguidas. É assim que quem executa se comporta." },
  ],
  10: [
    { id: "s10-1", texto: "Dez dias seguidos. Quem chega até aqui está construindo algo de verdade." },
    { id: "s10-2", texto: "{nome}, dez dias seguidos de presença. O seu compromisso com o plano está firme." },
    { id: "s10-3", texto: "Dez dias em sequência. Que constância bonita." },
  ],
  14: [
    { id: "s14-1", texto: "Duas semanas seguidas, {nome}. O hábito já tem raiz." },
    { id: "s14-2", texto: "Quatorze dias sem faltar. Você está no caminho." },
    { id: "s14-3", texto: "Duas semanas de presença seguida. Isso é rotina de verdade." },
  ],
  21: [
    { id: "s21-1", texto: "Vinte e um dias seguidos, {nome}. Três semanas de presença constante." },
    { id: "s21-2", texto: "Três semanas seguidas. O que antes pedia esforço agora pede só continuar." },
    { id: "s21-3", texto: "{nome}, são vinte e um dias em sequência. Que firmeza." },
  ],
  30: [
    { id: "s30-1", texto: "Trinta dias seguidos, {nome}. Um mês inteiro de compromisso com o seu plano." },
    { id: "s30-2", texto: "Um mês sem faltar. Isso é execução de verdade." },
    { id: "s30-3", texto: "Trinta presenças seguidas. Parabéns pela constância." },
  ],
};

export type FaixaDeRetorno = "curto" | "semana" | "quinzena" | "mes";

// Quanto tempo a pessoa ficou sem marcar presença antes de voltar.
export const MENSAGENS_RETORNO: Record<FaixaDeRetorno, Mensagem[]> = {
  curto: [
    { id: "r1-1", texto: "Que bom te ver de novo, {nome}. Sua próxima ação, {proxima}, continua te esperando.", usaProxima: true },
    { id: "r1-2", texto: "Voltar é o que importa. Retome de onde parou." },
    { id: "r1-3", texto: "{nome}, o seu plano ficou guardado. Pode seguir com calma." },
    { id: "r1-4", texto: "Bom ter você de volta. Um passo pequeno hoje já recoloca o ritmo." },
    { id: "r1-5", texto: "Você voltou, e isso já é um bom começo." },
  ],
  semana: [
    { id: "r2-1", texto: "Faz um tempo, {nome}, e que bom que você voltou. O plano continua do jeito que você deixou." },
    { id: "r2-2", texto: "Seu plano esperou por você. Retome com o menor passo e o resto vem." },
    { id: "r2-3", texto: "Uma pausa não apaga o que você já fez. Bom ter você de novo." },
    { id: "r2-4", texto: "{nome}, ficamos contentes com a sua volta. Que tal continuar por {proxima}?", usaProxima: true },
    { id: "r2-5", texto: "Voltar depois de uma semana mostra que o compromisso continua vivo." },
  ],
  quinzena: [
    { id: "r3-1", texto: "Que bom te ver, {nome}. Passaram algumas semanas, e o seu caminho continua aqui." },
    { id: "r3-2", texto: "Você voltou. Isso importa mais do que o tempo que passou." },
    { id: "r3-3", texto: "O seu plano segue no ponto em que você parou. Pode recomeçar por {proxima}.", usaProxima: true },
    { id: "r3-4", texto: "Ficamos muito felizes com a sua volta, {nome}." },
    { id: "r3-5", texto: "Recomeçar é parte do caminho. Estamos com você." },
  ],
  mes: [
    { id: "r4-1", texto: "Ficamos muito felizes com a sua volta, {nome}. O seu plano continua aqui, esperando por você." },
    { id: "r4-2", texto: "Passou um tempo, e tudo bem. O importante é que você está de volta." },
    { id: "r4-3", texto: "{nome}, que bom reencontrar você. Recomece pelo menor passo, no seu ritmo." },
    { id: "r4-4", texto: "O seu plano guardou tudo do jeito que você deixou. Vamos retomar?" },
    { id: "r4-5", texto: "Voltar depois de muito tempo pede coragem. Estamos contentes por você ter voltado." },
  ],
};

export const MARCOS_TOTAIS = [7, 30, 50, 100, 150, 200, 300, 365] as const;

// Marcos do contador total (não precisam ser seguidos).
export const MENSAGENS_MARCOS: Record<number, Mensagem[]> = {
  7: [
    { id: "m7-1", texto: "Sete dias de compromisso, {nome}. O contador mostra o caminho que você já fez." },
    { id: "m7-2", texto: "Dia {dias}: uma semana de presenças, mesmo que não tenham sido seguidas." },
  ],
  30: [
    { id: "m30-1", texto: "Trinta dias de presença, {nome}. Quanta coisa já foi feita." },
    { id: "m30-2", texto: "{dias} dias se comprometendo com o seu plano. Parabéns." },
  ],
  50: [
    { id: "m50-1", texto: "Cinquenta dias de presença. Isso é muito mais do que um começo." },
    { id: "m50-2", texto: "{nome}, você chegou ao dia {dias}. Que persistência." },
  ],
  100: [
    { id: "m100-1", texto: "Cem dias de compromisso, {nome}. Isso é um marco de verdade." },
    { id: "m100-2", texto: "Dia {dias}: cem vezes você disse Presente." },
  ],
  150: [
    { id: "m150-1", texto: "{dias} dias com você, {nome}. O seu plano agradece." },
    { id: "m150-2", texto: "Cento e cinquenta presenças. Uma jornada que já tem história." },
  ],
  200: [
    { id: "m200-1", texto: "Duzentos dias de presença. Que caminho." },
    { id: "m200-2", texto: "{nome}, dia {dias}. A sua constância inspira." },
  ],
  300: [
    { id: "m300-1", texto: "Trezentos dias de presença. Olhe o quanto você andou." },
    { id: "m300-2", texto: "{nome}, dia {dias}. Que trajetória." },
  ],
  365: [
    { id: "m365-1", texto: "Trezentos e sessenta e cinco dias de presença, {nome}. Parabéns pela persistência." },
    { id: "m365-2", texto: "Dia {dias}: um ano inteiro de compromisso, somando todos os seus Presentes." },
  ],
};
