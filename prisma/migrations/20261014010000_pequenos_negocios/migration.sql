-- Repositório de Pequenos Negócios (admin) — puramente aditivo.

CREATE TYPE "categoria_negocio" AS ENUM ('ENSINAR_E_DESENVOLVER', 'FAZER_OU_PRODUZIR', 'CUIDAR', 'ORGANIZAR_E_RESOLVER', 'COMUNICAR_E_VENDER', 'TECNOLOGIA', 'CONECTAR');

CREATE TABLE "subcategorias_negocio" (
    "id" TEXT NOT NULL,
    "categoria" "categoria_negocio" NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcategorias_negocio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subcategorias_negocio_categoria_slug_key" ON "subcategorias_negocio"("categoria", "slug");

CREATE TABLE "pequenos_negocios" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "status" "caminho_renda_status" NOT NULL DEFAULT 'PENDENTE_REVISAO',
    "notaRevisao" TEXT,

    "subcategoriaId" TEXT NOT NULL,
    "categoria" "categoria_negocio" NOT NULL,

    "nome" TEXT NOT NULL,
    "posicionamento" TEXT NOT NULL,
    "oQueOClienteRecebe" TEXT NOT NULL,

    "compradorSegmento" TEXT NOT NULL,
    "compradorPersona" TEXT NOT NULL,
    "gatilhoDeCompra" TEXT NOT NULL,
    "clientePagaParaResolver" TEXT NOT NULL,
    "sinalObservado" TEXT NOT NULL,
    "nivelEvidencia" "forca_evidencia" NOT NULL,
    "fontes" JSONB NOT NULL,

    "modeloDeReceita" TEXT NOT NULL,
    "faixaDePreco" JSONB,
    "comoCresce" TEXT NOT NULL,
    "riscoEstrutural" TEXT NOT NULL,
    "exigenciasLegais" TEXT,

    "tagOnde" TEXT NOT NULL,
    "tagQuemExecuta" TEXT NOT NULL,
    "tagPreparo" TEXT NOT NULL,
    "tagInvestimentoInicial" TEXT NOT NULL,
    "tagEscala" TEXT NOT NULL,
    "tagRetorno" TEXT NOT NULL,
    "tagReceita" TEXT NOT NULL,
    "tagCliente" TEXT NOT NULL,
    "habilidadesDoProfessor" TEXT[],
    "relacaoComDocencia" "relacao_com_docencia" NOT NULL,
    "enquadramentoMei" TEXT NOT NULL,
    "horasSemanaisMin" DOUBLE PRECISION,
    "horasSemanaisMax" DOUBLE PRECISION,

    "formasDeComecar" JSONB NOT NULL,

    "principalLacuna" TEXT,
    "testePilotoNecessario" TEXT,
    "conclusao" TEXT,

    "grupoSemelhante" TEXT,
    "fontesCompartilhadas" BOOLEAN NOT NULL DEFAULT false,

    "origem" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pequenos_negocios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pequenos_negocios_codigo_key" ON "pequenos_negocios"("codigo");

ALTER TABLE "pequenos_negocios" ADD CONSTRAINT "pequenos_negocios_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "subcategorias_negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
