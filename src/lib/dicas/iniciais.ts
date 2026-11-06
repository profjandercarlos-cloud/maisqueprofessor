// Banco inicial de dicas (escritas e revisadas à mão). Este arquivo é a fonte da verdade das dicas
// MANUAIS: na próxima presença depois de um deploy, o app grava as novas e atualiza o texto das que
// mudaram aqui (ver sincronizar.ts), pela `chave`, que é estável. Aposentar ou reativar uma dica
// continua sendo pelo admin.
// Estilo: português simples, abre SEMPRE com uma situação que a pessoa reconhece (uma pergunta),
// sem travessão e sem promessa de resultado. "ideia" só quando a fonte é conhecida (autor ou
// conceito), nunca citação.
import type { CategoriaDica } from "./categorias";

export type DicaInicial = {
  chave: string;
  categoria: CategoriaDica;
  titulo: string;
  texto: string;
  tenteHoje: string;
  ideia?: string;
};

export const DICAS_INICIAIS: DicaInicial[] = [
  // ===== Começar pequeno =====
  {
    chave: "m-001",
    categoria: "comecar",
    titulo: "Abrir já é começar",
    texto:
      "Você abre o plano, olha a lista e fecha de novo? Quando a tarefa parece grande, a mente foge dela. Reduza até caber em dois minutos e o começo deixa de pesar.",
    tenteHoje: "Se eu abrir o app hoje, então faço só o primeiro item do checklist.",
    ideia: "Regra dos dois minutos, James Clear (Hábitos Atômicos)",
  },
  {
    chave: "m-002",
    categoria: "comecar",
    titulo: "O primeiro passo pode ser feio",
    texto:
      "Você está esperando o momento certo para começar? Esse momento costuma durar semanas. A primeira versão de qualquer coisa é ruim, e é ela que mostra o que melhorar.",
    tenteHoje: "Se eu estiver adiando uma ação, então escrevo agora a pior versão possível dela, só para ela existir.",
  },
  {
    chave: "m-003",
    categoria: "comecar",
    titulo: "Procure o passo de entrada",
    texto:
      "Tem uma ação que você nem consegue olhar de frente? Quase sempre ela tem um passo de entrada simples, como abrir um arquivo ou escrever o nome de um cliente. Esse passo derruba a resistência do resto.",
    tenteHoje: "Se a próxima ação me assusta, então procuro nela o passo de entrada mais simples e faço só ele.",
    ideia: "Tiny Habits, BJ Fogg",
  },
  {
    chave: "m-004",
    categoria: "comecar",
    titulo: "O que foi começado fica na cabeça",
    texto:
      "Alguma coisa ficou pela metade e não sai da sua cabeça? A mente pede para terminar o que começou. Você pode usar isso a seu favor: começar já cria a vontade de continuar.",
    tenteHoje: "Se eu tiver só cinco minutos, então começo uma ação do plano e deixo anotado o próximo passo.",
    ideia: "Efeito Zeigarnik, Bluma Zeigarnik",
  },
  {
    chave: "m-005",
    categoria: "comecar",
    titulo: "Diga quando e onde vai fazer",
    texto:
      "Você diz que vai fazer, mas o dia passa? Um plano só na cabeça escapa fácil. Dito com hora e lugar, ele vira compromisso e fica bem mais difícil de esquecer.",
    tenteHoje:
      "Se eu escolher uma ação para hoje, então escrevo a hora e o lugar em que vou fazê-la e deixo essa frase à vista.",
    ideia: "Intenções de implementação, Peter Gollwitzer",
  },
  {
    chave: "m-006",
    categoria: "comecar",
    titulo: "Olhe só a próxima ação",
    texto:
      "Você olha a lista inteira e já se sente cansado? Ver tudo de uma vez pesa e paralisa. A ação seguinte é a única que precisa caber na sua cabeça hoje.",
    tenteHoje: "Se eu abrir o plano, então olho só a próxima ação e ignoro o resto da lista.",
  },
  {
    chave: "m-007",
    categoria: "comecar",
    titulo: "Comece antes de se sentir pronto",
    texto:
      "Você está esperando se sentir pronto para começar? Essa sensação costuma vir depois da prática, e não antes dela. Quem espera se sentir seguro acaba esperando muito.",
    tenteHoje: "Se eu estiver me preparando há dias, então escolho um item do checklist para fazer hoje, mesmo sem segurança.",
  },
  {
    chave: "m-008",
    categoria: "comecar",
    titulo: "Dois minutos para aquecer",
    texto:
      "Falta vontade e trinta minutos de trabalho parecem uma montanha? Prometa só dois. Funciona porque o mais comum é continuar depois que a resistência passa.",
    tenteHoje: "Se eu estiver sem vontade, então marco um timer de dois minutos e trabalho só até ele tocar.",
  },

  // ===== Ambiente e atrito =====
  {
    chave: "m-009",
    categoria: "atrito",
    titulo: "Deixe a próxima ação à vista",
    texto:
      "Você senta para executar e ainda precisa procurar por onde começar? O que está escondido não acontece. Deixe aberto, de véspera, o documento ou a conversa de que você precisa amanhã.",
    tenteHoje: "Se eu for dormir hoje, então deixo aberta a primeira coisa que preciso fazer amanhã.",
    ideia: "Hábitos Atômicos, James Clear",
  },
  {
    chave: "m-010",
    categoria: "atrito",
    titulo: "Afaste o que te distrai",
    texto:
      "O celular está ao lado enquanto você trabalha? A força de vontade perde para uma notificação a um toque de distância. Aumente essa distância.",
    tenteHoje: "Se eu sentar para executar, então deixo o celular em outro cômodo.",
  },
  {
    chave: "m-011",
    categoria: "atrito",
    titulo: "Reúna o material antes",
    texto:
      "Você senta para trabalhar e descobre que falta alguma coisa? Procurar atrasa e esfria o impulso. Deixar tudo à mão antes remove a desculpa do 'não achei'.",
    tenteHoje: "Se amanhã eu precisar de algo para executar, então separo isso hoje à noite.",
  },
  {
    chave: "m-012",
    categoria: "atrito",
    titulo: "Tenha um lugar de trabalho",
    texto:
      "Você tenta trabalhar no sofá, na cama, em qualquer canto? Trabalhar sempre no mesmo lugar ensina o corpo a entrar no modo de execução. O sofá lembra descanso, e a mesa lembra trabalho.",
    tenteHoje: "Se eu for executar, então vou ao mesmo lugar de sempre e uso esse lugar só para isso.",
  },
  {
    chave: "m-013",
    categoria: "atrito",
    titulo: "Prenda o hábito a algo que já existe",
    texto:
      "Você esquece de executar porque o dia não tem um horário certo para isso? Um hábito novo gruda melhor quando vem logo depois de outro que você já tem, como o café da manhã ou o banho.",
    tenteHoje: "Se eu terminar o café da manhã, então abro o plano e faço um item.",
    ideia: "Empilhamento de hábitos, BJ Fogg e James Clear",
  },
  {
    chave: "m-014",
    categoria: "atrito",
    titulo: "Facilite o que ajuda, dificulte o que atrapalha",
    texto:
      "Você sabe o que deveria fazer, mas acaba fazendo o que está mais à mão? Todo mundo faz isso. Deixe a próxima ação a um clique e o que distrai a vários.",
    tenteHoje:
      "Se eu notar uma distração que se repete, então crio um pequeno obstáculo para chegar nela, como sair da conta ou fechar o aplicativo.",
    ideia: "Arquitetura de escolha, Thaler e Sunstein (Nudge)",
  },
  {
    chave: "m-015",
    categoria: "atrito",
    titulo: "Decida hoje o que faz amanhã",
    texto:
      "Você começa o dia sem saber por onde ir e gasta energia só decidindo? Decidir tudo na hora cansa. Uma decisão tomada de antemão deixa só o fazer.",
    tenteHoje: "Se eu souber o que farei amanhã, então escrevo hoje a hora e a ação em uma linha.",
  },

  // ===== Foco e energia =====
  {
    chave: "m-016",
    categoria: "foco",
    titulo: "Vinte e cinco minutos de uma coisa só",
    texto:
      "Você abre várias coisas ao mesmo tempo e termina o dia sem concluir nenhuma? Misturar tarefas gasta energia sem avançar. Escolha uma e dê a ela um tempo fechado, com uma pausa no fim.",
    tenteHoje: "Se eu começar uma ação, então ponho um timer de 25 minutos e faço só ela.",
    ideia: "Técnica Pomodoro, Francesco Cirillo",
  },
  {
    chave: "m-017",
    categoria: "foco",
    titulo: "Descubra a sua melhor hora",
    texto:
      "Tem horas do dia em que você rende muito mais? Todo mundo tem. Coloque o passo mais difícil nesse horário e deixe o que é leve para quando a energia cai.",
    tenteHoje: "Se eu souber meu melhor horário, então reservo esse horário hoje para a próxima ação do plano.",
  },
  {
    chave: "m-018",
    categoria: "foco",
    titulo: "Faça primeiro o que mais pesa",
    texto:
      "Tem uma ação que você evita e que ocupa a sua cabeça o dia inteiro? Fazê-la logo cedo libera o resto do dia.",
    tenteHoje: "Se eu abrir o plano hoje, então começo pela ação que mais venho evitando.",
    ideia: "Eat That Frog, Brian Tracy",
  },
  {
    chave: "m-019",
    categoria: "foco",
    titulo: "O trabalho cresce para caber no tempo",
    texto:
      "Você dá um dia inteiro a uma tarefa que levaria uma hora? Ela vai levar o dia inteiro. Um tempo curto e definido ajuda a decidir o que realmente importa.",
    tenteHoje: "Se eu tiver uma ação hoje, então escolho quanto tempo ela merece e começo a contar.",
    ideia: "Lei de Parkinson, C. Northcote Parkinson",
  },
  {
    chave: "m-020",
    categoria: "foco",
    titulo: "Pausa não é preguiça",
    texto:
      "Você trabalha horas seguidas e, no fim, já não rende? Trabalhar sem parar derruba o rendimento. Uma pausa curta recupera a atenção e evita o cansaço que leva a desistir.",
    tenteHoje: "Se eu terminar um bloco de trabalho, então paro cinco minutos longe da tela.",
  },
  {
    chave: "m-021",
    categoria: "foco",
    titulo: "Foco profundo se treina",
    texto:
      "Você perde o foco depois de poucos minutos? Ficar concentrado é uma habilidade que cresce com a prática, como um músculo. Comece com blocos pequenos e aumente aos poucos.",
    tenteHoje: "Se eu conseguir 20 minutos sem distração hoje, então amanhã tento 25.",
    ideia: "Deep Work, Cal Newport",
  },
  {
    chave: "m-022",
    categoria: "foco",
    titulo: "Dormir bem também é parte do plano",
    texto:
      "Dormiu mal e tudo parece mais difícil, até começar? É assim mesmo. Cuidar do sono é cuidar da sua capacidade de executar.",
    tenteHoje: "Se eu estiver exausto hoje, então escolho a menor ação do plano e me deito mais cedo.",
  },
  {
    chave: "m-023",
    categoria: "foco",
    titulo: "Anote a ideia, não a siga agora",
    texto:
      "Uma ideia aparece e você abandona o que estava fazendo? Anote em uma linha e volte ao foco. Você resolve depois, com a cabeça livre.",
    tenteHoje: "Se uma ideia surgir enquanto eu trabalho, então anoto em uma frase e continuo a ação atual.",
  },

  // ===== Recomeçar =====
  {
    chave: "m-024",
    categoria: "recomecar",
    titulo: "Parou? Recomece pelo menor passo",
    texto:
      "Ficou uns dias sem executar e está com vergonha de voltar? Perder uns dias não apaga o que você já fez. O que pesa é o tamanho do recomeço, então não tente recuperar o tempo perdido.",
    tenteHoje: "Se eu voltei depois de uma pausa, então faço a menor ação possível do meu plano.",
  },
  {
    chave: "m-025",
    categoria: "recomecar",
    titulo: "Um dia perdido não vale uma semana",
    texto:
      "Falhou um dia e pensou 'já que estraguei, deixo para lá'? Muita gente pensa isso e abandona tudo. É esse pensamento que custa caro, e não a falha.",
    tenteHoje: "Se eu faltar um dia, então retomo no seguinte sem tentar compensar.",
    ideia: "Efeito 'que se dane' (what-the-hell effect), Polivy e Herman",
  },
  {
    chave: "m-026",
    categoria: "recomecar",
    titulo: "Evite faltar duas vezes seguidas",
    texto:
      "Ontem não deu para fazer nada? Faltar um dia acontece com todo mundo. Faltar dois começa a virar hábito. Um passo mínimo hoje já interrompe isso.",
    tenteHoje: "Se eu não tiver feito nada ontem, então hoje faço pelo menos um item do checklist.",
    ideia: "Hábitos Atômicos, James Clear",
  },
  {
    chave: "m-027",
    categoria: "recomecar",
    titulo: "Fale consigo como falaria com um amigo",
    texto:
      "Você se cobra por ter parado como nunca cobraria um amigo? A autocrítica dura cansa e atrapalha quem tenta de novo.",
    tenteHoje:
      "Se eu me criticar por ter parado, então penso no que diria a um amigo na mesma situação e digo isso a mim mesmo.",
    ideia: "Autocompaixão, Kristin Neff",
  },
  {
    chave: "m-028",
    categoria: "recomecar",
    titulo: "Releia o que você já fez",
    texto:
      "Parou e agora só enxerga o que falta? Quem para costuma esquecer o caminho percorrido. Rever as ações já concluídas devolve a prova de que você é capaz de avançar.",
    tenteHoje: "Se eu estiver desanimado, então abro as minhas conquistas no plano e leio o que já concluí.",
  },
  {
    chave: "m-029",
    categoria: "recomecar",
    titulo: "Crie o seu próprio recomeço",
    texto:
      "Você está esperando a próxima segunda-feira para recomeçar? O início de um mês ou de uma semana dá a sensação de página em branco, mas você pode criar um recomeço desses hoje, em qualquer dia.",
    tenteHoje: "Se eu sentir que me atrasei, então declaro hoje como o meu dia 1 e faço o primeiro passo.",
    ideia: "Efeito do recomeço (fresh start), Dai, Milkman e Riis",
  },
  {
    chave: "m-030",
    categoria: "recomecar",
    titulo: "Descubra o que te fez parar",
    texto:
      "Você parou e nem sabe direito por quê? Quase sempre há uma razão: uma ação difícil demais, falta de tempo ou medo. Descobrir qual foi evita a mesma pausa na próxima vez.",
    tenteHoje: "Se eu estiver parado, então escrevo numa frase o que me travou e divido essa ação em duas menores.",
  },

  // ===== Medo de vender e de rejeição =====
  {
    chave: "m-031",
    categoria: "medo",
    titulo: "Um 'não' também é resposta",
    texto:
      "Você escreve a mensagem e já imagina o pior? Um 'não' mostra o que ajustar, e até o silêncio ensina alguma coisa.",
    tenteHoje: "Se eu tiver um contato a fazer, então envio a mensagem hoje e anoto a resposta, seja qual for.",
  },
  {
    chave: "m-032",
    categoria: "medo",
    titulo: "Treine ouvir 'não'",
    texto:
      "O medo de ouvir 'não' faz você adiar o contato? Quem busca ouvir 'não' de propósito, em pequenos pedidos, perde o medo aos poucos. O 'não' deixa de assustar quando vira rotina.",
    tenteHoje: "Se eu tiver coragem hoje, então faço um pedido pequeno com chance de ouvir 'não' e observo o que sinto.",
    ideia: "Rejection Proof, Jia Jiang",
  },
  {
    chave: "m-033",
    categoria: "medo",
    titulo: "Você não está pedindo um favor",
    texto:
      "Você sente que está pedindo um favor quando oferece o seu serviço? Oferecer um serviço pago não é pedir ajuda. É propor uma troca em que a outra pessoa também ganha.",
    tenteHoje: "Se eu for falar com um possível cliente, então começo pelo que posso resolver para ele e só depois falo do preço.",
  },
  {
    chave: "m-034",
    categoria: "medo",
    titulo: "Comece por quem já te conhece",
    texto:
      "Não sabe com quem falar primeiro? O primeiro cliente costuma estar perto: alguém que já viu o seu trabalho ou confia em você. É mais fácil começar a conversa ali.",
    tenteHoje: "Se eu precisar de um primeiro contato, então listo cinco pessoas que já conhecem o meu trabalho e escolho uma.",
  },
  {
    chave: "m-035",
    categoria: "medo",
    titulo: "Faça uma pergunta, não um discurso",
    texto:
      "Você conta tudo sobre o seu serviço assim que alguém demonstra interesse? Falar demais afasta. Perguntar sobre o problema da outra pessoa aproxima e mostra que você está ouvindo.",
    tenteHoje: "Se eu conversar com um possível cliente, então faço duas perguntas antes de falar do que ofereço.",
  },
  {
    chave: "m-036",
    categoria: "medo",
    titulo: "Silêncio não é rejeição",
    texto:
      "Mandou a mensagem e ninguém respondeu? A mente conclui que é um 'não'. Na maioria das vezes, a pessoa só estava ocupada.",
    tenteHoje: "Se eu não tiver resposta em alguns dias, então envio uma segunda mensagem curta e cordial.",
  },
  {
    chave: "m-037",
    categoria: "medo",
    titulo: "Ensaie a conversa em voz alta",
    texto:
      "Você fica nervoso só de pensar na conversa de venda? Falar o que você vai dizer em voz alta reduz o nervosismo. Na hora da conversa, as palavras já estão no corpo.",
    tenteHoje: "Se eu tiver uma conversa de venda, então ensaio em voz alta a abertura e as respostas às dúvidas mais comuns.",
  },
  {
    chave: "m-038",
    categoria: "medo",
    titulo: "Venda o resultado, não o serviço",
    texto:
      "Você explica tudo o que faz e a pessoa não se anima? As pessoas compram o que muda na vida ou no trabalho delas, e não a lista do que você faz.",
    tenteHoje: "Se eu descrever o meu serviço, então reescrevo a frase dizendo o que a pessoa terá depois dele.",
  },

  // ===== Validar antes de construir =====
  {
    chave: "m-039",
    categoria: "validar",
    titulo: "Pergunte da vida dela, não da sua ideia",
    texto:
      "Todo mundo achou a sua ideia ótima? As pessoas elogiam ideias, mas contam a verdade sobre os próprios problemas. Pergunte como ela resolve isso hoje.",
    tenteHoje:
      "Se eu conversar com alguém do meu público, então pergunto como ela lida hoje com o problema e quanto isso custa.",
    ideia: "The Mom Test, Rob Fitzpatrick",
  },
  {
    chave: "m-040",
    categoria: "validar",
    titulo: "Elogio não é compra",
    texto:
      "Ouviu 'que ideia boa' e ficou animado? É agradável, mas não prova que alguém pagaria. O sinal forte é tempo, dinheiro ou um compromisso.",
    tenteHoje: "Se alguém elogiar o meu serviço, então pergunto qual seria o próximo passo para contratá-lo.",
  },
  {
    chave: "m-041",
    categoria: "validar",
    titulo: "Teste pequeno antes de construir muito",
    texto:
      "Você está preparando tudo antes de saber se alguém quer? Antes disso, descubra se há interesse. Um teste simples pode poupar semanas de trabalho em algo que ninguém pediu.",
    tenteHoje: "Se eu estiver construindo algo grande, então penso na versão mais simples que um cliente real aceitaria.",
    ideia: "Produto mínimo viável, Eric Ries",
  },
  {
    chave: "m-042",
    categoria: "validar",
    titulo: "Saia do prédio",
    texto:
      "Você já pesquisou muito e ainda não falou com ninguém? As respostas que importam estão do lado de fora, com as pessoas que vão pagar. Planilhas e pesquisas não substituem uma conversa.",
    tenteHoje: "Se eu estiver pesquisando há dias, então marco uma conversa real com alguém do meu público.",
    ideia: "Steve Blank",
  },
  {
    chave: "m-043",
    categoria: "validar",
    titulo: "Peça o sim antes de fazer tudo",
    texto:
      "Você pergunta se a pessoa compraria e ouve sempre 'talvez'? Quando alguém se compromete antes de o serviço existir por completo, você sabe que ele vale. Pedir um compromisso, mesmo pequeno, ensina mais do que perguntar.",
    tenteHoje: "Se eu tiver um interessado, então proponho um piloto pago, com escopo pequeno e claro.",
  },
  {
    chave: "m-044",
    categoria: "validar",
    titulo: "Registre o que as pessoas disseram",
    texto:
      "Saiu de uma conversa e já não lembra o que a pessoa disse? A memória distorce. O que o cliente disse, com as palavras dele, vira a melhor matéria-prima para a sua oferta.",
    tenteHoje: "Se eu conversar com alguém, então anoto logo depois três frases que a pessoa usou.",
  },
  {
    chave: "m-045",
    categoria: "validar",
    titulo: "Imagine que falhou e por quê",
    texto:
      "Prestes a começar algo importante, você só pensa em como vai dar certo? Pergunte também: se isso der errado daqui a três meses, qual terá sido o motivo? Isso mostra riscos que você ainda pode evitar.",
    tenteHoje:
      "Se eu estiver iniciando uma ação importante, então escrevo três motivos pelos quais ela poderia falhar e um jeito de evitar cada um.",
    ideia: "Pré-mortem, Gary Klein",
  },
  {
    chave: "m-046",
    categoria: "validar",
    titulo: "Uma pessoa só já ensina",
    texto:
      "Está esperando ter mais dados para agir? Você não precisa de cem respostas para aprender. A primeira conversa real costuma mostrar mais do que muita pesquisa.",
    tenteHoje: "Se eu estiver esperando 'ter mais dados', então converso hoje com uma única pessoa do meu público.",
  },

  // ===== Precificar e cobrar =====
  {
    chave: "m-047",
    categoria: "preco",
    titulo: "Preço baixo demais também afasta",
    texto:
      "Você pensou em cobrar menos para ninguém dizer 'não'? Isso costuma passar a sensação de que o serviço vale pouco. Calcule o que o trabalho custa e cobre isso.",
    tenteHoje: "Se eu definir um preço, então escrevo a conta por trás dele: tempo, custos e resultado para o cliente.",
  },
  {
    chave: "m-048",
    categoria: "preco",
    titulo: "Diga o preço e espere",
    texto:
      "Você falou o preço e logo começou a justificá-lo? Depois de falar o valor, quem fala primeiro costuma ceder. Aguente o silêncio e deixe a outra pessoa pensar.",
    tenteHoje: "Se eu falar um preço, então paro de falar e espero a resposta.",
  },
  {
    chave: "m-049",
    categoria: "preco",
    titulo: "Cobre pelo resultado, não pelas horas",
    texto:
      "Você cobra por hora trabalhada? Assim, ganha menos quanto mais rápido fica. O cliente paga pelo que muda para ele.",
    tenteHoje: "Se eu montar uma proposta, então descrevo o resultado e dou um valor por ele.",
  },
  {
    chave: "m-050",
    categoria: "preco",
    titulo: "Faça o piloto com preço, não de graça",
    texto:
      "Pensou em fazer o primeiro serviço de graça, só para testar? Trabalho gratuito ensina pouco, porque ninguém leva muito a sério o que não paga. Um preço pequeno já mostra se há interesse de verdade.",
    tenteHoje: "Se eu oferecer um piloto, então coloco um valor, mesmo reduzido, e explico o motivo.",
  },
  {
    chave: "m-051",
    categoria: "preco",
    titulo: "Combine tudo antes de começar",
    texto:
      "Fechou um serviço só na conversa? Escopo, prazo e forma de pagamento sem acordo viram dor de cabeça depois. Uma combinação clara protege os dois lados.",
    tenteHoje: "Se eu fechar um serviço, então registro por escrito o que está incluso e o que não está.",
  },
  {
    chave: "m-052",
    categoria: "preco",
    titulo: "Saiba o mínimo que você aceita",
    texto:
      "Vai negociar e não sabe até onde pode ceder? Negociar sem saber o seu mínimo leva a aceitar qualquer valor. Defina antes o piso que mantém o trabalho viável para você.",
    tenteHoje:
      "Se eu for negociar, então defino antes o menor valor que aceitaria e o que eu poderia incluir ou tirar da proposta.",
  },
  {
    chave: "m-053",
    categoria: "preco",
    titulo: "Pergunte quanto o problema custa",
    texto:
      "O seu preço parece alto para o cliente? Quando você sabe quanto o problema custa a ele, o seu preço fica pequeno perto do que ele resolve.",
    tenteHoje: "Se eu conversar com um cliente, então pergunto o que esse problema custa a ele hoje.",
  },

  // ===== Constância sem culpa =====
  {
    chave: "m-054",
    categoria: "constancia",
    titulo: "O dia ruim não cancela o plano",
    texto:
      "Teve um dia em que nada rendeu? Faça a versão mínima, um único item, e o dia continua valendo.",
    tenteHoje: "Se eu estiver sem energia, então faço só um passo e paro sem culpa.",
  },
  {
    chave: "m-055",
    categoria: "constancia",
    titulo: "Constância vale mais que intensidade",
    texto:
      "Você fez muito em um dia e depois sumiu por uma semana? Um pouco todo dia vence muito de vez em quando. Quem sustenta um ritmo possível chega mais longe do que quem se esgota.",
    tenteHoje: "Se eu estiver animado hoje, então faço o que planejei e não o dobro.",
  },
  {
    chave: "m-056",
    categoria: "constancia",
    titulo: "Comemore o que já foi feito",
    texto:
      "Você só vê o que ainda falta fazer? Reconhecer o que já avançou dá combustível para continuar.",
    tenteHoje: "Se eu concluir uma ação, então paro um minuto para reconhecer o que consegui.",
  },
  {
    chave: "m-057",
    categoria: "constancia",
    titulo: "Compare-se com você de ontem",
    texto:
      "Viu o que alguém já conquistou e sentiu que está atrasado? Comparar assim desanima. O que importa é se você está mais perto do que estava na semana passada.",
    tenteHoje: "Se eu me comparar com alguém, então volto a olhar só o que avancei na última semana.",
  },
  {
    chave: "m-058",
    categoria: "constancia",
    titulo: "Seja generoso com o seu ritmo",
    texto:
      "Sua semana está cheia de trabalho, família e cansaço? Você tem uma vida além do plano. Um ritmo possível vale mais do que um ideal que você abandona.",
    tenteHoje: "Se a minha semana estiver cheia, então escolho o mínimo do plano e aceito que seja pouco.",
  },
  {
    chave: "m-059",
    categoria: "constancia",
    titulo: "Peça companhia",
    texto:
      "Você tem um objetivo difícil e está tentando sozinho? É mais difícil abandonar algo que outra pessoa sabe que você está fazendo. Contar a alguém de confiança cria apoio.",
    tenteHoje: "Se eu tiver um objetivo difícil, então conto a uma pessoa o que vou fazer esta semana.",
  },
  {
    chave: "m-060",
    categoria: "constancia",
    titulo: "Aprenda com o erro sem se punir",
    texto:
      "Algo deu errado e você só consegue pensar no erro? Errar faz parte de executar. A pergunta útil é 'o que isso me mostrou?', e não 'o que há de errado comigo?'.",
    tenteHoje: "Se algo der errado, então escrevo uma coisa que aprendi e uma que vou mudar.",
  },
];
