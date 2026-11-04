-- CreateTable
CREATE TABLE "produtos_quimicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "numeroOnu" TEXT NOT NULL,
    "classeRisco" TEXT NOT NULL,
    "grupoCompatibilidade" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_quimicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsaveis_tecnicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "conselho" TEXT NOT NULL,
    "numeroRegistro" TEXT NOT NULL,
    "especialidade" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsaveis_tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargas_quimicas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "produtoQuimicoId" TEXT NOT NULL,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "unidadeMedida" TEXT NOT NULL,
    "classificacaoRisco" TEXT NOT NULL,
    "responsavelTecnicoId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargas_quimicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_carga" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "dataValidade" TIMESTAMP(3),
    "validado" BOOLEAN NOT NULL DEFAULT false,
    "urlArquivo" TEXT,

    CONSTRAINT "documentos_carga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspecoes" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataSolicitacao" TIMESTAMP(3) NOT NULL,
    "dataConclusao" TIMESTAMP(3),
    "resultado" TEXT NOT NULL,
    "inspetor" TEXT,

    CONSTRAINT "inspecoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_historico" (
    "id" TEXT NOT NULL,
    "cargaId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo" TEXT NOT NULL,
    "ator" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,

    CONSTRAINT "eventos_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produtos_quimicos_nome_key" ON "produtos_quimicos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_tecnicos_conselho_numeroRegistro_key" ON "responsaveis_tecnicos"("conselho", "numeroRegistro");

-- CreateIndex
CREATE UNIQUE INDEX "cargas_quimicas_codigo_key" ON "cargas_quimicas"("codigo");

-- CreateIndex
CREATE INDEX "cargas_quimicas_status_idx" ON "cargas_quimicas"("status");

-- CreateIndex
CREATE INDEX "eventos_historico_cargaId_dataHora_idx" ON "eventos_historico"("cargaId", "dataHora");

-- AddForeignKey
ALTER TABLE "cargas_quimicas" ADD CONSTRAINT "cargas_quimicas_produtoQuimicoId_fkey" FOREIGN KEY ("produtoQuimicoId") REFERENCES "produtos_quimicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargas_quimicas" ADD CONSTRAINT "cargas_quimicas_responsavelTecnicoId_fkey" FOREIGN KEY ("responsavelTecnicoId") REFERENCES "responsaveis_tecnicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_carga" ADD CONSTRAINT "documentos_carga_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "cargas_quimicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspecoes" ADD CONSTRAINT "inspecoes_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "cargas_quimicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_historico" ADD CONSTRAINT "eventos_historico_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "cargas_quimicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
