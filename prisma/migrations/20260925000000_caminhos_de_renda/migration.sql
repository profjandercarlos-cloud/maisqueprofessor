-- Repositório de Caminhos de Renda (admin) — puramente aditivo, nenhuma
-- tabela existente é tocada.

CREATE TYPE "caminho_renda_status" AS ENUM ('PENDENTE_REVISAO', 'APROVADO', 'REJEITADO');
CREATE TYPE "forca_evidencia" AS ENUM ('OFERTA_PUBLICADA', 'PEDIDO_DOCUMENTADO', 'SELECAO_CONCLUIDA', 'CONTRATO_COM_VALOR', 'PILOTO_PAGO_DO_PROFESSOR');
CREATE TYPE "relacao_com_docencia" AS ENUM ('ENSINO_FORA_DA_ESCOLA', 'EDUCACAO_SEM_AULA', 'OUTRO_SETOR');

CREATE TABLE "caminhos_renda" (
    "id" TEXT NOT NULL,
    "status" "caminho_renda_status" NOT NULL DEFAULT 'PENDENTE_REVISAO',
    "notaRevisao" TEXT,

    "titulo" TEXT NOT NULL,
    "posicionamento" TEXT NOT NULL,
    "categoriaMercado" TEXT NOT NULL,

    "compradorSegmento" TEXT NOT NULL,
    "compradorPersona" TEXT NOT NULL,
    "gatilho" TEXT NOT NULL,
    "forcaEvidencia" "forca_evidencia" NOT NULL,
    "fontes" JSONB NOT NULL,

    "capacidadeAVerificar" TEXT NOT NULL,
    "relacaoComDocencia" "relacao_com_docencia" NOT NULL,
    "restricoes" TEXT,

    "primeiraEntregaVendavel" TEXT NOT NULL,
    "canalDeAcesso" TEXT NOT NULL,
    "modeloDeReceita" TEXT NOT NULL,
    "comoCresce" TEXT NOT NULL,
    "riscoEstrutural" TEXT NOT NULL,

    "precoReferenciaExterna" JSONB,
    "precoPrimeiroContratoReal" DOUBLE PRECISION,
    "horasReaisPorEntrega" DOUBLE PRECISION,
    "rendaMensalLiquidaObservada" DOUBLE PRECISION,

    "habilidadeNuclear" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "capital" TEXT NOT NULL,
    "mecanismoRenda" TEXT NOT NULL,
    "investigavelNoDiagnostico" BOOLEAN NOT NULL DEFAULT true,
    "grupoDeOfertasSemelhantes" TEXT,

    "principalLacuna" TEXT NOT NULL,
    "testePilotoNecessario" TEXT NOT NULL,

    "origem" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caminhos_renda_pkey" PRIMARY KEY ("id")
);
