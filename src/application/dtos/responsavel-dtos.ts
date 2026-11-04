export interface CriarResponsavelInput {
  nome: string;
  conselho: string;
  numeroRegistro: string;
  especialidade?: string | undefined;
}

export interface ResponsavelOutput {
  id: string;
  nome: string;
  conselho: string;
  numeroRegistro: string;
  registroProfissional: string;
  especialidade: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}
