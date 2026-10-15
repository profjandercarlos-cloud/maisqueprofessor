// As 5 fichas escritas à mão e aprovadas pelo dono do produto (out/2026).
// Servem a dois fins: (1) são gravadas direto no banco para esses 5 negócios, e
// (2) são os exemplos que ensinam o tom e a estrutura à IA que gera as demais
// (ver src/lib/ai-engine/gerar-ficha-professor-prompt.ts).
import { FICHA_VERSAO, type FichaProfessor } from "./ficha";

const MEI = "Ainda não verificamos o enquadramento como MEI. Antes de crescer, converse com um contador.";

export const FICHAS_EXEMPLO: Record<string, FichaProfessor> = {
  "ENS-APR-001": {
    versao: FICHA_VERSAO,
    vende:
      "Aulas individuais online de matemática, focadas em uma dificuldade específica do aluno, com exercícios seus e um registro simples da evolução.",
    paraQuem: "Pais e responsáveis de alunos do ensino fundamental ou médio.",
    quando: "As notas caem ou a dúvida persiste, e a família não consegue ajudar em casa.",
    porque: [
      "Você já explica o mesmo conteúdo de formas diferentes até o aluno entender. É exatamente isso que o cliente paga.",
      "Você já monta exercícios, corrige e acompanha a evolução de cada aluno.",
      "O que muda é o formato: em vez de turma, atendimento individual.",
    ],
    preco: {
      referencia:
        "Anúncios públicos de aula de matemática: R$ 80 por hora (plataforma de aulas) e R$ 120 por aula avulsa (professor com mais de 10 anos de atuação).",
      aviso: "Não são preços de quem está começando.",
      sugestao: "Faixa de partida: R$ 60 a R$ 80 por aula de 1 hora.",
      estimativa: true,
      conta: "Exemplo de conta, não promessa: 5 aulas por semana a R$ 70 dão cerca de R$ 1.400 por mês.",
    },
    preparar: [
      "Escolher UM conteúdo que você domina muito bem (por exemplo, frações ou equações de 1º grau).",
      "Montar um diagnóstico curto para descobrir onde está a dificuldade do aluno.",
      "Preparar uma aula-piloto e uma lista de exercícios com resolução.",
    ],
    comeco: {
      fazer: "Montar um diagnóstico curto e uma aula sobre um conteúdo que você domina.",
      cliente: "Indicações voluntárias de famílias, de alunos que NÃO sejam das turmas sob sua responsabilidade.",
      depois: "Oferecer um pacote mensal com objetivo verificável.",
    },
    cresce: {
      c0: "Aulas avulsas para os primeiros alunos, vendidas pelo seu tempo.",
      c1: "Transformar as aulas avulsas em pacotes mensais e formar uma carteira fixa de alunos, com horários definidos. O limite passa a ser a sua agenda.",
      c5: "Uma pequena escola de reforço online: turmas por nível, professores parceiros e materiais próprios, com você cuidando do método e dos resultados em vez de dar todas as aulas.",
      alem: "Venda cadernos de exercícios autorais, que não dependem da sua hora, ou faça plantões de matemática em escolas privadas e centros de estudo.",
    },
    cuidados: [
      "Divulgue como aula particular ou reforço, sem prometer certificado nem habilitação oficial.",
      "Não capte alunos usando sua posição na escola.",
      "Combine por escrito valor, horário e cancelamento, e cuide dos dados do aluno.",
      MEI,
    ],
    amostraPlano: {
      titulo: "Semana 1: seu diagnóstico pronto",
      tarefa: "Montar um diagnóstico de 10 questões sobre o conteúdo que você escolheu.",
      feitoQuando: "Quando o diagnóstico estiver pronto e testado com uma pessoa conhecida.",
    },
  },

  "COM-CAN-001": {
    versao: FICHA_VERSAO,
    vende:
      "Um calendário de publicações e os posts prontos e publicados, para um comércio local que não tem tempo de manter o perfil ativo.",
    paraQuem: "Donos de comércio local (loja, salão, restaurante) com perfil parado.",
    quando: "O perfil está abandonado ou posta sem regularidade.",
    porque: [
      "Você organiza calendário e prazos o ano todo. É planejamento de aula aplicado a publicações.",
      "Você escreve para públicos diferentes e sabe explicar com clareza.",
      "Criatividade para transformar um mesmo assunto em vários formatos.",
    ],
    preco: {
      referencia: "Agências anunciam de R$ 350 a R$ 600 por mês de presença digital (perfil local e uma rede social).",
      aviso: "É preço de agência, não de quem está começando, e inclui mais do que só redes sociais.",
      sugestao: "Para a primeira entrega (4 publicações em 1 canal): faixa de partida de R$ 150 a R$ 250.",
      estimativa: true,
      conta: "A ideia é começar por uma entrega única, com preço de teste, e só depois oferecer a mensalidade.",
    },
    preparar: [
      "Aprender o básico de planejamento de conteúdo para uma rede social.",
      "Dominar uma ferramenta simples de criação de imagens.",
      "Saber ler os números básicos do perfil (alcance, curtidas) para mostrar ao cliente.",
    ],
    comeco: {
      fazer: "Organizar um calendário e produzir quatro publicações de um canal.",
      cliente:
        "Mostrar a um pequeno comércio uma análise do perfil dele, feita só com informações públicas e sem prometer resultados.",
      depois: "Oferecer um ciclo mensal e registrar indicadores úteis ao cliente.",
    },
    cresce: {
      c0: "Uma entrega pequena e única (calendário e 4 publicações) para o primeiro comércio.",
      c1: "Especializar-se em um tipo de comércio (por exemplo, salões ou restaurantes) e criar um processo repetível de calendário e publicações, com clientes mensais.",
      c5: "Uma pequena agência de nicho: você define a estratégia e o padrão de qualidade, e designers, fotógrafos e redatores parceiros produzem o material.",
      alem: "Venda pacotes autorais de layouts editáveis para o seu setor, ou entregue pelo canal de uma agência existente enquanto monta a sua carteira.",
    },
    cuidados: [
      "Faça um contrato dizendo o que está incluído e quantas revisões o cliente tem.",
      "Use só imagens e músicas com autorização.",
      "Nunca prometa vendas, seguidores ou posição em buscas. O cliente pode esperar vendas que você não controla: combine desde o início o que você entrega.",
      "Publicidade deve aparecer identificada como publicidade.",
      MEI,
    ],
    amostraPlano: {
      titulo: "Semana 1: seu modelo de calendário",
      tarefa: "Montar um calendário de 4 publicações para um tipo de comércio que você escolheu.",
      feitoQuando: "Quando as 4 publicações estiverem escritas e com a arte pronta.",
    },
  },

  "ORG-EMP-001": {
    versao: FICHA_VERSAO,
    vende:
      "Você cuida da agenda de um profissional autônomo: marca, confirma e remarca atendimentos, seguindo regras que ele aprovou.",
    paraQuem: "Autônomos e pequenos prestadores que atendem clientes por horário.",
    quando: "Há faltas, conflitos de horário e excesso de mensagens para responder.",
    porque: [
      "Você já lida com horários, prazos e recados para famílias e colegas.",
      "Comunicação clara e educada, que é o que o cliente do seu cliente vê.",
      "Organização: seguir regras combinadas, sem improvisar.",
    ],
    preco: {
      referencia: "Ainda não temos preço de referência confiável para esta ideia.",
      aviso: null,
      sugestao:
        "Por isso mostramos como montar o seu: some as horas semanais de atendimento e multiplique pelo seu valor-hora, cobrando um pacote por semana.",
      estimativa: false,
      conta: "Exemplo de conta, não preço de mercado: 5 h por semana × R$ 30 por hora = R$ 150 por semana.",
    },
    preparar: [
      "Aprender uma ferramenta de agenda online compartilhada.",
      "Criar modelos de mensagem de confirmação e de lembrete.",
      "Definir seus horários de resposta (quando você atende o cliente).",
    ],
    comeco: {
      fazer: "Organizar e confirmar uma semana de agenda de um prestador, com horários e regras definidos.",
      cliente: "Abordar um prestador local com agenda pública, levando uma demonstração com dados fictícios.",
      depois: "Documentar o processo e oferecer continuidade com limites claros.",
    },
    cresce: {
      c0: "Uma semana de agenda organizada para o primeiro prestador.",
      c1: "Padronizar o serviço para um tipo de profissional e manter uma carteira pequena de clientes mensais, com horários de atendimento definidos.",
      c5: "Uma assessoria virtual com equipe: você cuida do processo e do relacionamento com os clientes, e assistentes com horários definidos atendem as agendas.",
      alem: "Venda um kit de confirmação, lembretes e política de agenda com licença de uso, ou opere uma carteira encaminhada por uma empresa de assistência virtual.",
    },
    cuidados: [
      "Combine horários de resposta (por exemplo, 3 vezes ao dia): o cliente pode querer resposta imediata enquanto você está em sala.",
      "Faça contrato com o que você faz, os horários de resposta e o sigilo das informações.",
      "Cuide dos dados dos clientes dele (proteção de dados).",
      "Você presta serviço; não vira funcionário dele. Combine o que você faz e os horários, sem ordens diretas dele sobre como trabalhar.",
      "Não faça triagem nem oriente clientes sobre assuntos da profissão dele (por exemplo, saúde).",
      MEI,
    ],
    amostraPlano: {
      titulo: "Semana 1: sua demonstração de agenda",
      tarefa: "Montar uma agenda fictícia de uma semana, com confirmações e remarcações.",
      feitoQuando: "Quando a demonstração puder ser mostrada a um cliente em 3 minutos.",
    },
  },

  "PRO-ALI-002": {
    versao: FICHA_VERSAO,
    vende:
      "Bolos caseiros de receita padronizada, embalados e identificados, feitos sob encomenda para famílias e pequenos cafés.",
    paraQuem: "Famílias e pequenos estabelecimentos que compram bolo pronto.",
    quando: "Café em família ou reunião pequena.",
    porque: [
      "Receita padronizada exige repetir o mesmo resultado: método e rotina, como no seu planejamento.",
      "Você já organiza prazos e quantidades para entregar no dia combinado.",
      "Capricho no acabamento e na apresentação.",
    ],
    preco: {
      referencia: "Uma loja online anuncia bolo caseiro de 500 g a R$ 25.",
      aviso: "É o preço de um vendedor específico, sem entrega, e não considera o seu custo.",
      sugestao: "Antes de fixar o preço, some ingredientes, embalagem, gás ou energia e o seu tempo por bolo.",
      estimativa: false,
      conta: null,
    },
    preparar: [
      "Padronizar 2 receitas e testar até o resultado sair sempre igual.",
      "Conhecer as exigências de higiene, conservação, transporte e rotulagem.",
      "Verificar a licença sanitária da sua cidade antes da primeira venda.",
    ],
    comeco: {
      fazer: "Assar a receita do cliente na cozinha dele, como serviço de preparo, depois de verificar as condições do local.",
      cliente: "Indicações locais e contato com famílias.",
      depois: "Padronizar uma entrega que possa virar produto seu.",
    },
    cresce: {
      c0: "Preparo de bolos sob encomenda, na cozinha do cliente, sem estoque próprio.",
      c1: "Reduzir a um catálogo curto dos bolos mais pedidos, padronizar custo e prazo e organizar rotas de entrega para encomendas recorrentes.",
      c5: "Uma pequena marca de bolos com produção regular, ajudante na cozinha e pontos de reposição em cafés e empórios.",
      alem: "Venda lotes padronizados para cafés e empórios já regularizados, em vez de depender só de encomendas avulsas.",
    },
    cuidados: [
      "Vender alimento exige licença sanitária. Confirme na vigilância sanitária da sua cidade ANTES da primeira venda.",
      "Emita documento fiscal conforme a sua situação e confirme com um contador.",
      "Não use marcas ou personagens sem autorização.",
      "Não dê orientação de dieta.",
      MEI,
    ],
    amostraPlano: {
      titulo: "Semana 1: suas duas receitas padrão",
      tarefa: "Testar cada receita até o resultado sair igual 3 vezes e anotar o custo de cada bolo.",
      feitoQuando: "Quando as 2 receitas e o custo de cada bolo estiverem registrados.",
    },
  },

  "CUI-ANI-001": {
    versao: FICHA_VERSAO,
    vende: "Passeio individual com o cão, com duração, trajeto e um breve relatório combinados com o tutor.",
    paraQuem: "Tutores de cães em bairros onde a rotina de trabalho é intensa.",
    quando: "Falta tempo ou compromisso para passear com o cão.",
    porque: [
      "Você já cuida de rotinas, combinados e da confiança das famílias.",
      "Organização de horários e trajetos.",
      "Relacionamento: o cliente quer alguém de confiança.",
    ],
    preco: {
      referencia:
        "Ainda não temos preço de referência confiável: as páginas conferidas traziam valores inconsistentes e foram descartadas.",
      aviso: null,
      sugestao:
        "Antes de definir o seu, pesquise 3 passeadores do seu bairro. O preço por passeio vezes o número de passeios por semana dá a sua renda.",
      estimativa: false,
      conta: null,
    },
    preparar: [
      "Fazer um curso curto de manejo seguro de cães.",
      "Aprender a avaliar o comportamento do cão antes do primeiro passeio.",
      "Ter um plano de emergência (veterinário próximo e contato do tutor).",
    ],
    comeco: {
      fazer:
        "Depois do treino de manejo, fazer um passeio individual com um cão compatível com a sua experiência, com autorização do tutor.",
      cliente: "Indicações no bairro e perfil em plataforma.",
      depois: "Documentar o que está incluído, a duração e o padrão de atendimento.",
    },
    cresce: {
      c0: "Passeios individuais para os primeiros tutores do bairro.",
      c1: "Montar uma rota compacta em um bairro, com clientes fixos e protocolos de segurança, para perder menos tempo entre endereços.",
      c5: "Uma pequena operação de passeios com passeadores treinados por você, seguindo o seu padrão de segurança e de atendimento.",
      alem: "Atenda pelo canal de pet shops ou plataformas para ter clientes sem precisar captar, ou monte uma carteira própria e contrate ajudantes conforme a demanda.",
    },
    cuidados: [
      "Comece com 1 cão e 1 bairro: os principais riscos são fuga, mordida e tempo perdido entre endereços.",
      "Faça contrato com duração, trajeto e responsabilidades, e peça autorização do tutor.",
      "Verifique as exigências da sua prefeitura.",
      "Faça só o passeio: sem adestramento clínico nem tratamentos.",
      "Cuide dos dados do tutor.",
      MEI,
    ],
    amostraPlano: {
      titulo: "Semana 1: preparo e segurança",
      tarefa: "Fazer o curso curto de manejo e montar o seu plano de emergência.",
      feitoQuando: "Quando o curso estiver concluído e o plano de emergência escrito.",
    },
  },
};
