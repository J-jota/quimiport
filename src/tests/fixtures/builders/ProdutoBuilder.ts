import { ProdutoQuimico } from '../../../domain/produto/ProdutoQuimico.js';
import { ClasseRisco } from '../../../domain/enums/ClasseRisco.js';
import { GrupoCompatibilidade } from '../../../domain/enums/GrupoCompatibilidade.js';

export const AGORA = new Date('2026-01-15T12:00:00.000Z');
export const VALIDADE_FUTURA = new Date('2027-01-15T12:00:00.000Z');
export const VALIDADE_PASSADA = new Date('2025-01-15T12:00:00.000Z');

export class ProdutoBuilder {
  private props = {
    nome: 'Ácido Sulfúrico',
    descricao: 'Ácido mineral forte utilizado em processos industriais',
    numeroOnu: 'ONU 1830',
    classeRisco: ClasseRisco.CORROSIVO,
    grupoCompatibilidade: GrupoCompatibilidade.B,
    agora: AGORA,
  };

  static valido(): ProdutoBuilder {
    return new ProdutoBuilder();
  }

  semNome(): ProdutoBuilder {
    this.props.nome = '';
    return this;
  }

  semClasseRisco(): ProdutoBuilder {
    this.props.classeRisco = undefined as unknown as ClasseRisco;
    return this;
  }

  comNumeroOnu(numeroOnu: string): ProdutoBuilder {
    this.props.numeroOnu = numeroOnu;
    return this;
  }

  comNome(nome: string): ProdutoBuilder {
    this.props.nome = nome;
    return this;
  }

  build(): ProdutoQuimico {
    return ProdutoQuimico.criar(this.props);
  }
}
