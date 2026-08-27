-- CreateEnum
CREATE TYPE "nivel_execucao" AS ENUM ('VALIDACAO', 'IMPLEMENTACAO', 'DESENVOLVIMENTO');

-- CreateEnum
CREATE TYPE "ritmo_desejado" AS ENUM ('RAPIDO', 'EQUILIBRADO', 'GRADUAL', 'SISTEMA_RECOMENDA');

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "nivelExecucao" "nivel_execucao" NOT NULL,
ADD COLUMN     "proporcaoAprendizado" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "resultadoMinimoViavel" TEXT NOT NULL,
ADD COLUMN     "ritmoDesejado" "ritmo_desejado" NOT NULL,
ADD COLUMN     "ttfrResultado" TEXT NOT NULL,
ADD COLUMN     "ttfrSemanas" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "possibilities" ADD COLUMN     "mapaExecucao" JSONB;
