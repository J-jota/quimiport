import { beforeEach, describe, expect, it } from 'vitest';

import {
  BuscarProdutoQuimicoPorId,
  ListarProdutosQuimicos,
} from '../../../application/use-cases/produto/ConsultarProdutosQuimicos.js';
import { AtualizarProdutoQuimico } from '../../../application/use-cases/produto/AtualizarProdutoQuimico.js';
import { CriarProdutoQuimico } from '../../../application/use-cases/produto/CriarProdutoQuimico.js';
import { InativarProdutoQuimico } from '../../../application/use-cases/produto/InativarProdutoQuimico.js';
import { InMemoryProdutoQuimicoRepository } from '../../../infrastructure/persistence/in-memory/repositorios.js';
import { ClockFake } from '../../fixtures/ClockFake.js';

const INPUT_VALIDO = {
  nome: 'Ácido Sulfúrico',
  descricao: 'Ácido mineral forte',
  numeroOnu: 'ONU 1830',
  classeRisco: 'CORROSIVO',
  grupoCompatibilidade: 'B',
};

describe('Casos de uso — ProdutoQuimico', () => {
  let produtos: InMemoryProdutoQuimicoRepository;
  let clock: ClockFake;

  beforeEach(() => {
    produtos = new InMemoryProdutoQuimicoRepository();
    clock = new ClockFake();
  });

  it('UC-01: cadastra produto químico (caminho feliz)', async () => {
    const useCase = new CriarProdutoQuimico(produtos, clock);

    const output = await useCase.executar(INPUT_VALIDO);

    expect(output.id).toBeDefined();
    expect(output.ativo).toBe(true);
    expect(output.classeRisco).toBe('CORROSIVO');
    expect(await produtos.listar()).toHaveLength(1);
  });

  it('UC-01: rejeita produto duplicado pelo nome (ConflictError)', async () => {
    const useCase = new CriarProdutoQuimico(produtos, clock);
    await useCase.executar(INPUT_VALIDO);

    await expect(useCase.executar(INPUT_VALIDO)).rejects.toMatchObject({
      tipo: 'CONFLITO',
    });
  });

  it('UC-01: rejeita enum de classe de risco inválido (ValidationError)', async () => {
    const useCase = new CriarProdutoQuimico(produtos, clock);

    await expect(
      useCase.executar({ ...INPUT_VALIDO, classeRisco: 'PERIGOSO_MESMO' }),
    ).rejects.toMatchObject({ tipo: 'VALIDACAO', codigo: 'ENUM_INVALIDO' });
  });

  it('lista e busca produtos por id', async () => {
    const criar = new CriarProdutoQuimico(produtos, clock);
    const criado = await criar.executar(INPUT_VALIDO);

    const lista = await new ListarProdutosQuimicos(produtos).executar();
    expect(lista).toHaveLength(1);

    const encontrado = await new BuscarProdutoQuimicoPorId(produtos).executar(criado.id);
    expect(encontrado.nome).toBe('Ácido Sulfúrico');

    await expect(new BuscarProdutoQuimicoPorId(produtos).executar('inexistente')).rejects.toMatchObject({
      tipo: 'NAO_ENCONTRADO',
    });
  });

  it('atualiza produto e rejeita conflito de nome com outro produto', async () => {
    const criar = new CriarProdutoQuimico(produtos, clock);
    const primeiro = await criar.executar(INPUT_VALIDO);
    await criar.executar({ ...INPUT_VALIDO, nome: 'Hidróxido de Sódio', numeroOnu: 'ONU 1823' });

    const atualizar = new AtualizarProdutoQuimico(produtos, clock);
    const atualizado = await atualizar.executar(primeiro.id, { nome: 'Ácido Sulfúrico 98%' });
    expect(atualizado.nome).toBe('Ácido Sulfúrico 98%');

    await expect(
      atualizar.executar(primeiro.id, { nome: 'Hidróxido de Sódio' }),
    ).rejects.toMatchObject({ tipo: 'CONFLITO' });
  });

  it('UC-02: inativa produto e falha ao inativar produto inexistente', async () => {
    const criar = new CriarProdutoQuimico(produtos, clock);
    const criado = await criar.executar(INPUT_VALIDO);

    const inativar = new InativarProdutoQuimico(produtos, clock);
    const inativado = await inativar.executar(criado.id);
    expect(inativado.ativo).toBe(false);

    await expect(inativar.executar('inexistente')).rejects.toMatchObject({
      tipo: 'NAO_ENCONTRADO',
    });
  });
});
