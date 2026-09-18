-- DropIndex
DROP INDEX "metas_categorias_usuarioId_categoriaId_mes_ano_key";

-- AlterTable
-- `criadoEm` ja nasce com default. `atualizadoEm` e NOT NULL sem default no
-- schema (o valor e gerenciado pelo Prisma via @updatedAt), mas a tabela ja tem
-- linhas: adicionamos com default para preencher o passado e removemos o default
-- em seguida, para o estado final bater com o schema e nao gerar drift.
ALTER TABLE "categorias" ADD COLUMN     "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "categorias" ALTER COLUMN "atualizadoEm" DROP DEFAULT;

-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "subcategoriaId" TEXT;

-- AlterTable
ALTER TABLE "recorrencias" ADD COLUMN     "subcategoriaId" TEXT;

-- AlterTable
ALTER TABLE "metas_categorias" ADD COLUMN     "subcategoriaId" TEXT;

-- CreateTable
CREATE TABLE "subcategorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "icone" TEXT,
    "cor" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,

    CONSTRAINT "subcategorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subcategorias_usuarioId_idx" ON "subcategorias"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "subcategorias_categoriaId_nome_key" ON "subcategorias"("categoriaId", "nome");

-- CreateIndex
-- Alvo da FK composta: garante que (subcategoriaId, categoriaId) so exista se a
-- subcategoria realmente pertencer aquela categoria.
CREATE UNIQUE INDEX "subcategorias_id_categoriaId_key" ON "subcategorias"("id", "categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "metas_categorias_usuarioId_categoriaId_subcategoriaId_mes_a_key" ON "metas_categorias"("usuarioId", "categoriaId", "subcategoriaId", "mes", "ano");

-- AddForeignKey
ALTER TABLE "subcategorias" ADD CONSTRAINT "subcategorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategorias" ADD CONSTRAINT "subcategorias_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_subcategoriaId_categoriaId_fkey" FOREIGN KEY ("subcategoriaId", "categoriaId") REFERENCES "subcategorias"("id", "categoriaId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recorrencias" ADD CONSTRAINT "recorrencias_subcategoriaId_categoriaId_fkey" FOREIGN KEY ("subcategoriaId", "categoriaId") REFERENCES "subcategorias"("id", "categoriaId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_categorias" ADD CONSTRAINT "metas_categorias_subcategoriaId_categoriaId_fkey" FOREIGN KEY ("subcategoriaId", "categoriaId") REFERENCES "subcategorias"("id", "categoriaId") ON DELETE RESTRICT ON UPDATE CASCADE;
