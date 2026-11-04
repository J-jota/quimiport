import type { CargaQuimicaRepository } from '../../application/ports/CargaQuimicaRepository.js';
import type { Clock } from '../../application/ports/Clock.js';
import type { ProdutoQuimicoRepository } from '../../application/ports/ProdutoQuimicoRepository.js';
import type { ResponsavelTecnicoRepository } from '../../application/ports/ResponsavelTecnicoRepository.js';
import { AtualizarStatusCarga, BloquearCargaQuimica, CancelarCargaQuimica, LiberarCargaQuimica } from '../../application/use-cases/carga/AcaoStatusUseCases.js';
import { BuscarCargaQuimicaPorId, ConsultarHistoricoCarga, ListarCargasQuimicas } from '../../application/use-cases/carga/ConsultarCargasQuimicas.js';
import { AnexarDocumentoCarga, RegistrarResultadoInspecao, SolicitarInspecao, ValidarDocumentoCarga } from '../../application/use-cases/carga/DocumentacaoInspecaoUseCases.js';
import { RegistrarCargaQuimica } from '../../application/use-cases/carga/RegistrarCargaQuimica.js';
import { AtualizarProdutoQuimico } from '../../application/use-cases/produto/AtualizarProdutoQuimico.js';
import { BuscarProdutoQuimicoPorId, ListarProdutosQuimicos } from '../../application/use-cases/produto/ConsultarProdutosQuimicos.js';
import { CriarProdutoQuimico } from '../../application/use-cases/produto/CriarProdutoQuimico.js';
import { InativarProdutoQuimico } from '../../application/use-cases/produto/InativarProdutoQuimico.js';
import { BuscarResponsavelTecnicoPorId, CriarResponsavelTecnico, ListarResponsaveisTecnicos } from '../../application/use-cases/responsavel/ResponsavelTecnicoUseCases.js';

/** Dependências injetadas na camada de interface (permite fakes nos testes). */
export interface Repositorios {
  produtos: ProdutoQuimicoRepository;
  responsaveis: ResponsavelTecnicoRepository;
  cargas: CargaQuimicaRepository;
}

/** Contêiner de composição: instancia os casos de uso com as portas. */
export function montarCasosDeUso(repos: Repositorios, clock: Clock) {
  return {
    // produtos
    criarProduto: new CriarProdutoQuimico(repos.produtos, clock),
    listarProdutos: new ListarProdutosQuimicos(repos.produtos),
    buscarProduto: new BuscarProdutoQuimicoPorId(repos.produtos),
    atualizarProduto: new AtualizarProdutoQuimico(repos.produtos, clock),
    inativarProduto: new InativarProdutoQuimico(repos.produtos, clock),
    // responsáveis
    criarResponsavel: new CriarResponsavelTecnico(repos.responsaveis, clock),
    listarResponsaveis: new ListarResponsaveisTecnicos(repos.responsaveis),
    buscarResponsavel: new BuscarResponsavelTecnicoPorId(repos.responsaveis),
    // cargas
    registrarCarga: new RegistrarCargaQuimica(repos.cargas, repos.produtos, repos.responsaveis, clock),
    listarCargas: new ListarCargasQuimicas(repos.cargas),
    buscarCarga: new BuscarCargaQuimicaPorId(repos.cargas),
    consultarHistorico: new ConsultarHistoricoCarga(repos.cargas),
    anexarDocumento: new AnexarDocumentoCarga(repos.cargas, clock),
    validarDocumento: new ValidarDocumentoCarga(repos.cargas, clock),
    solicitarInspecao: new SolicitarInspecao(repos.cargas, clock),
    registrarResultadoInspecao: new RegistrarResultadoInspecao(repos.cargas, clock),
    liberarCarga: new LiberarCargaQuimica(repos.cargas, clock),
    bloquearCarga: new BloquearCargaQuimica(repos.cargas, clock),
    cancelarCarga: new CancelarCargaQuimica(repos.cargas, clock),
    atualizarStatusCarga: new AtualizarStatusCarga(repos.cargas, clock),
  };
}

export type CasosDeUso = ReturnType<typeof montarCasosDeUso>;
