import { describe, expect, it } from 'vitest';

import { ProdutoQuimico } from '../../../domain/produto/ProdutoQuimico.js';
import { NumeroONU } from '../../../domain/value-objects/NumeroONU.js';
import { DomainError } from '../../../shared/errors/errors.js';
import { AGORA, ProdutoBuilder } from '../../fixtures/builders/ProdutoBuilder.js';

describe('ProdutoQuimico', () => {
  it('cadastra produto químico válido com status ativo', () => {
    const produto = ProdutoBuilder.valido().build();

    const snapshot = produto.toSnapshot();
    expect(snapshot.nome).toBe('Ácido Sulfúrico');
    expect(snapshot.numeroOnu).toBe('ONU 1830');
    expect(snapshot.ativo).toBe(true);
    expect(snapshot.criadoEm).toEqual(AGORA);
    expect(snapshot.atualizadoEm).toEqual(AGORA);
  });

  it('RN-08: não permite cadastrar produto químico sem nome', () => {
    expect(() => ProdutoBuilder.valido().semNome().build()).toThrowError(DomainError);
    expect(() => ProdutoBuilder.valido().semNome().build()).toThrowError(
      expect.objectContaining({ codigo: 'RN-08' }),
    );
  });

  it('RN-09: não permite cadastrar produto químico sem classe de risco', () => {
    expect(() => ProdutoBuilder.valido().semClasseRisco().build()).toThrowError(
      expect.objectContaining({ codigo: 'RN-09' }),
    );
  });

  it('não permite cadastrar produto com número ONU em formato inválido', () => {
    expect(() => ProdutoBuilder.valido().comNumeroOnu('1830').build()).toThrowError(
      expect.objectContaining({ codigo: 'NUMERO_ONU_INVALIDO' }),
    );
  });

  it('inativa produto ativo e rejeita inativação duplicada', () => {
    const produto = ProdutoBuilder.valido().build();

    produto.inativar(AGORA);
    expect(produto.ativo).toBe(false);

    expect(() => produto.inativar()).toThrowError(
      expect.objectContaining({ codigo: 'PRODUTO_JA_INATIVO' }),
    );
  });

  it('atualiza dados do produto preservando obrigatoriedade do nome (RN-08)', () => {
    const produto = ProdutoBuilder.valido().build();

    produto.atualizar({ nome: 'Ácido Clorídrico', numeroOnu: 'ONU 1789' });
    expect(produto.toSnapshot().nome).toBe('Ácido Clorídrico');
    expect(produto.toSnapshot().numeroOnu).toBe('ONU 1789');

    expect(() => produto.atualizar({ nome: '  ' })).toThrowError(
      expect.objectContaining({ codigo: 'RN-08' }),
    );
  });

  it('reconstitui produto a partir da persistência sem revalidar', () => {
    const original = ProdutoBuilder.valido().build();
    const reconstituido = ProdutoQuimico.reconstituir({
      id: original.id,
      nome: original.nome,
      descricao: null,
      numeroOnu: NumeroONU.criar('ONU 1830'),
      classeRisco: original.classeRisco,
      grupoCompatibilidade: original.toSnapshot().grupoCompatibilidade,
      ativo: original.ativo,
      criadoEm: AGORA,
      atualizadoEm: AGORA,
    });
    expect(reconstituido.id).toBe(original.id);
    expect(reconstituido.toSnapshot().numeroOnu).toBe('ONU 1830');
  });
});
