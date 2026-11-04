import { ClasseRisco } from '../../domain/enums/ClasseRisco.js';
import { GrupoCompatibilidade } from '../../domain/enums/GrupoCompatibilidade.js';

export interface CriarProdutoInput {
  nome: string;
  descricao?: string | undefined;
  numeroOnu: string;
  classeRisco: string;
  grupoCompatibilidade: string;
}

export interface AtualizarProdutoInput {
  nome?: string | undefined;
  descricao?: string | undefined;
  numeroOnu?: string | undefined;
  classeRisco?: string | undefined;
  grupoCompatibilidade?: string | undefined;
}

export interface ProdutoOutput {
  id: string;
  nome: string;
  descricao: string | null;
  numeroOnu: string;
  classeRisco: ClasseRisco;
  grupoCompatibilidade: GrupoCompatibilidade;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}
