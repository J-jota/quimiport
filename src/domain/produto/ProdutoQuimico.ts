import { randomUUID } from 'node:crypto';

import { DomainError } from '../../shared/errors/errors.js';
import { asProdutoQuimicoId, type ProdutoQuimicoId } from '../../shared/types/branded.js';
import { ClasseRisco } from '../enums/ClasseRisco.js';
import { GrupoCompatibilidade } from '../enums/GrupoCompatibilidade.js';
import { NumeroONU } from '../value-objects/NumeroONU.js';

export interface ProdutoQuimicoProps {
  id: ProdutoQuimicoId;
  nome: string;
  descricao: string | null;
  numeroOnu: NumeroONU;
  classeRisco: ClasseRisco;
  grupoCompatibilidade: GrupoCompatibilidade;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface CriarProdutoProps {
  nome: string;
  descricao?: string | undefined;
  numeroOnu: string;
  classeRisco: ClasseRisco;
  grupoCompatibilidade: GrupoCompatibilidade;
  agora?: Date;
}

export interface AtualizarProdutoProps {
  nome?: string | undefined;
  descricao?: string | undefined;
  numeroOnu?: string | undefined;
  classeRisco?: ClasseRisco | undefined;
  grupoCompatibilidade?: GrupoCompatibilidade | undefined;
  agora?: Date;
}

/**
 * Agregado ProdutoQuimico — catálogo de produtos químicos (raiz única).
 * Regras protegidas: RN-08 (nome obrigatório), RN-09 (classe de risco
 * obrigatória), RN-10 (inativo não entra em novas cargas).
 */
export class ProdutoQuimico {
  private constructor(private props: ProdutoQuimicoProps) {}

  static criar(input: CriarProdutoProps): ProdutoQuimico {
    const nome = input.nome?.trim() ?? '';
    if (!nome) {
      throw new DomainError('RN-08', 'Um produto químico não pode ser cadastrado sem nome');
    }
    if (!input.classeRisco) {
      throw new DomainError('RN-09', 'Um produto químico não pode ser cadastrado sem classe de risco');
    }
    if (!input.grupoCompatibilidade) {
      throw new DomainError(
        'GRUPO_COMPATIBILIDADE_OBRIGATORIO',
        'Um produto químico não pode ser cadastrado sem grupo de compatibilidade',
      );
    }

    const agora = input.agora ?? new Date();
    return new ProdutoQuimico({
      id: asProdutoQuimicoId(randomUUID()),
      nome,
      descricao: input.descricao?.trim() || null,
      numeroOnu: NumeroONU.criar(input.numeroOnu),
      classeRisco: input.classeRisco,
      grupoCompatibilidade: input.grupoCompatibilidade,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  /** Reconstrói o agregado a partir da persistência, sem revalidar. */
  static reconstituir(props: ProdutoQuimicoProps): ProdutoQuimico {
    return new ProdutoQuimico(props);
  }

  get id(): ProdutoQuimicoId {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get classeRisco(): ClasseRisco {
    return this.props.classeRisco;
  }

  atualizar(input: AtualizarProdutoProps): void {
    if (input.nome !== undefined) {
      const nome = input.nome.trim();
      if (!nome) {
        throw new DomainError('RN-08', 'Um produto químico não pode ficar sem nome');
      }
      this.props.nome = nome;
    }
    if (input.descricao !== undefined) {
      this.props.descricao = input.descricao.trim() || null;
    }
    if (input.numeroOnu !== undefined) {
      this.props.numeroOnu = NumeroONU.criar(input.numeroOnu);
    }
    if (input.classeRisco !== undefined) {
      this.props.classeRisco = input.classeRisco;
    }
    if (input.grupoCompatibilidade !== undefined) {
      this.props.grupoCompatibilidade = input.grupoCompatibilidade;
    }
    this.props.atualizadoEm = input.agora ?? new Date();
  }

  /** RN-10: produto inativo não pode ser usado em novas cargas. */
  inativar(agora: Date = new Date()): void {
    if (!this.props.ativo) {
      throw new DomainError('PRODUTO_JA_INATIVO', `O produto "${this.props.nome}" já está inativo`);
    }
    this.props.ativo = false;
    this.props.atualizadoEm = agora;
  }

  toSnapshot(): {
    id: string;
    nome: string;
    descricao: string | null;
    numeroOnu: string;
    classeRisco: ClasseRisco;
    grupoCompatibilidade: GrupoCompatibilidade;
    ativo: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
  } {
    return {
      id: this.props.id,
      nome: this.props.nome,
      descricao: this.props.descricao,
      numeroOnu: this.props.numeroOnu.codigo,
      classeRisco: this.props.classeRisco,
      grupoCompatibilidade: this.props.grupoCompatibilidade,
      ativo: this.props.ativo,
      criadoEm: this.props.criadoEm,
      atualizadoEm: this.props.atualizadoEm,
    };
  }
}
