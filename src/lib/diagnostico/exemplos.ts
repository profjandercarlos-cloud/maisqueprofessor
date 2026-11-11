// Exemplos de resposta das perguntas abertas em que mais se foge do que foi pedido. Cada um mostra
// uma resposta que ajuda e uma que atrapalha, com o motivo. Os assuntos são de propósito variados
// e comuns (festa, planilha, vendas de doce) para o exemplo mostrar o FORMATO e não induzir o tema:
// a pessoa deve contar a própria história.
export type ExemploDeResposta = { bom: string; fraco: string; porque: string };

export const EXEMPLOS_DE_RESPOSTA: Record<string, ExemploDeResposta> = {
  "ajuda-procurada": {
    bom: "Colegas me pedem planilhas de controle (notas, estoque da cantina, rifa da festa) e meu primo me pede para revisar currículo e carta de apresentação. Eu sento com a pessoa, entendo o que ela precisa e entrego a planilha ou o texto pronto.",
    fraco: "As pessoas me procuram porque sou paciente e gosto de ajudar.",
    porque: "Descreve uma qualidade. Falta o que pedem e o que você faz por elas.",
  },
  "experiencias-alem-docencia": {
    bom: "Em 2019 vendi doces por encomenda: eu calculava o preço, combinava a entrega e atendia os clientes pelo WhatsApp. Hoje sou voluntária numa ONG e monto a escala dos outros voluntários.",
    fraco: "Faço cursos online e assisto vídeos sobre empreender.",
    porque: "Cursos e vídeos mostram interesse, não experiência. Conte o que você fez de fato.",
  },
  "situacao-real-1": {
    bom: "Situação: na feira de ciências, os grupos chegaram sem saber onde montar os estandes e a fila de entrada travou.\nO que fiz: desenhei a planta do pátio, numerei os espaços, sorteei os lugares e deixei um responsável em cada entrada.\nO que mudou: a montagem terminou meia hora antes do horário e a direção pediu o mesmo modelo para o próximo evento.",
    fraco: "Situação: tinha muita coisa para fazer.\nO que fiz: ajudei a organizar e dei apoio à equipe.\nO que mudou: ficou tudo melhor.",
    porque: "Não diz o que aconteceu, o que VOCÊ fez, nem o que mudou de concreto.",
  },
  "situacao-real-2": {
    bom: "Situação: o grupo de pais do WhatsApp virou confusão: mensagens repetidas, avisos perdidos, gente saindo.\nO que fiz: criei três regras simples, passei a fixar um aviso por semana e comecei a reunir as dúvidas numa lista única.\nO que mudou: as mensagens caíram pela metade e ninguém mais perdeu a data das reuniões.",
    fraco: "Situação: um problema na escola.\nO que fiz: participei da solução junto com todos.\nO que mudou: melhorou.",
    porque: "Fala de um problema sem contar qual foi, e a sua parte some no meio do grupo.",
  },
  "contribuicao-diferenciada": {
    bom: "Eu costumo deixar tudo pronto antes: reviso os detalhes, antecipo o que pode dar errado e deixo um roteiro escrito. Por isso os eventos que organizo raramente têm imprevistos.",
    fraco: "Sou criativo, responsável e comunicativo.",
    porque: "São qualidades. A pergunta pede uma ação que dê para observar.",
  },
  "curiosidade-espontanea": {
    bom: "Passo horas lendo sobre como cooperativas de agricultura familiar vendem direto para restaurantes e vendo vídeos sobre logística de entrega. Já fiz, por conta própria, uma tabela comparando preços de três feiras.",
    fraco: "Gosto de tudo um pouco, de ler e de aprender coisas novas.",
    porque: "Não diz quais assuntos nem o que você faz com eles.",
  },
  "aprendizado-desejado": {
    bom: "Gostaria de aprender técnicas de mediação de conflitos entre pessoas e equipes, e como conduzir uma reunião difícil até um acordo.",
    fraco: "Gostaria de aprender mais sobre tecnologia.",
    porque: "É genérico. Falta citar uma ferramenta, uma técnica ou uma área específica.",
  },
  "vida-profissional-desejada": {
    bom: "Daqui a 3 anos quero trabalhar de casa em três dias da semana, escolher meus clientes, ter horário flexível e uma renda mensal estável, resolvendo um problema concreto de pequenas empresas.",
    fraco: "Quero ser feliz e ganhar bem.",
    porque: "Não descreve rotina, autonomia, tipo de atividade nem o resultado que você quer produzir.",
  },
  "meta-financeira-mensal": {
    bom: "Entre R$ 4.000 e R$ 6.000 por mês, líquidos.",
    fraco: "O que Deus quiser / Muito dinheiro.",
    porque: "Informe um valor ou uma faixa em reais, por mês, já descontados custos e impostos.",
  },
  "publicos-acessiveis": {
    bom: "Conheço donos de pequenos comércios do meu bairro, pais de alunos que trabalham em escritórios e cinco colegas que hoje atuam em RH.",
    fraco: "Todo mundo.",
    porque: 'Não dá para saber quem. Se não houver ninguém, escreva "nenhum público específico", que é uma resposta válida.',
  },
};
