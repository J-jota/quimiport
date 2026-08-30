# Aplicação de JavaScript Avançado e TypeScript

Como os recursos de JavaScript moderno (ES6+) e TypeScript serão usados na construção do QuimiPort, com exemplos conceituais da modelagem planejada.

## 1. Tipagem forte

Todo o domínio será estritamente tipado (`strict: true` no `tsconfig`). IDs usam **branded types** para impedir trocas acidentais:

```typescript
// shared/types/Branded.ts
type Brand<T, B> = T & { readonly __brand: B };

export type CargaId = Brand<string, 'CargaId'>;
export type ProdutoQuimicoId = Brand<string, 'ProdutoQuimicoId'>;
export type ResponsavelTecnicoId = Brand<string, 'ResponsavelTecnicoId'>;

// ❌ não compila: passar ProdutoQuimicoId onde se espera CargaId
function consultarHistorico(id: CargaId) { /* ... */ }
```

## 2. Interfaces (contratos e portas)

Portas da camada de aplicação definidas como interfaces — a infraestrutura as implementa futuramente (inversão de dependência):

```typescript
// application/ports/CargaRepository.ts
export interface CargaRepository {
  salvar(carga: CargaQuimica): Promise<void>;
  buscarPorId(id: CargaId): Promise<CargaQuimica | null>;
  buscarPorStatus(status: StatusCarga): Promise<CargaQuimica[]>;
}

// application/ports/ProdutoQuimicoRepository.ts
export interface ProdutoQuimicoRepository {
  buscarPorId(id: ProdutoQuimicoId): Promise<ProdutoQuimico | null>;
  salvar(produto: ProdutoQuimico): Promise<void>;
}
```

## 3. Classes — entidades ricas (quando fizer sentido)

Classes para entidades/agregados (comportamento + estado protegido); objetos imutáveis e funções para value objects e validações:

```typescript
// domain/carga/CargaQuimica.ts (conceitual)
export class CargaQuimica {
  private constructor(
    readonly id: CargaId,
    readonly produtoQuimicoId: ProdutoQuimicoId,
    readonly quantidade: Quantidade,           // VO imutável
    readonly classificacaoRisco: ClasseRisco,
    readonly responsavelTecnicoId: ResponsavelTecnicoId,
    private status: StatusCarga,
    private documentos: DocumentoCarga[] = [],
    private historico: EventoHistorico[] = [],
  ) {}

  // Factory: RN-01, RN-03, RN-11, RN-12 garantidas na construção
  static registrar(props: RegistrarCargaProps): CargaQuimica { /* validações */ }

  liberar(ator: string, motivo: string): void {
    // RN-04: documentação obrigatória completa e válida
    ValidadorDocumentacao.validarParaLiberacao(this.documentos);
    this.transicionarStatus(StatusCarga.LIBERADA, ator, motivo); // RN-13: histórico
  }

  private transicionarStatus(destino: StatusCarga, ator: string, motivo: string): void {
    StatusCargaMachine.validarTransicao(this.status, destino); // máquina de estados
    this.historico.push(EventoHistorico.criar(this.status, destino, ator, motivo));
    this.status = destino;
  }
}
```

## 4. Enums para status e classificações

```typescript
// domain/enums/StatusCarga.ts
export enum StatusCarga {
  REGISTRADA   = 'REGISTRADA',
  EM_VALIDACAO = 'EM_VALIDACAO',
  EM_INSPECAO  = 'EM_INSPECAO',
  LIBERADA     = 'LIBERADA',
  BLOQUEADA    = 'BLOQUEADA',
  CANCELADA    = 'CANCELADA',
  FINALIZADA   = 'FINALIZADA',
}

export enum ClasseRisco {
  INFLAMAVEL = 'INFLAMAVEL',
  TOXICO = 'TOXICO',
  CORROSIVO = 'CORROSIVO',
  OXIDANTE = 'OXIDANTE',
  EXPLOSIVO = 'EXPLOSIVO',
  RADIOATIVO = 'RADIOATIVO',
  NAO_PERIGOSO = 'NAO_PERIGOSO',
}

export enum TipoDocumento { FISPQ, CONHECIMENTO_EMBARQUE, CERTIFICADO_INSPECAO, ALVARA }
export enum ResultadoInspecao { PENDENTE, APROVADA, REPROVADA }
export enum UnidadeMedida { KG, TON, LITRO, M3 }
```

## 5. Funções puras para validações

Validações determinísticas (sem efeitos colaterais) como funções puras — fáceis de testar exaustivamente:

```typescript
// domain/carga/StatusCargaMachine.ts (conceitual)
const TRANSICOES: Readonly<Record<StatusCarga, readonly StatusCarga[]>> = {
  [StatusCarga.REGISTRADA]:   [StatusCarga.EM_VALIDACAO, StatusCarga.CANCELADA],
  [StatusCarga.EM_VALIDACAO]: [StatusCarga.LIBERADA, StatusCarga.EM_INSPECAO,
                               StatusCarga.BLOQUEADA, StatusCarga.CANCELADA],
  [StatusCarga.EM_INSPECAO]:  [StatusCarga.LIBERADA, StatusCarga.BLOQUEADA, StatusCarga.CANCELADA],
  [StatusCarga.BLOQUEADA]:    [StatusCarga.EM_VALIDACAO, StatusCarga.CANCELADA],
  [StatusCarga.LIBERADA]:     [StatusCarga.FINALIZADA],
  [StatusCarga.CANCELADA]:    [], // terminal
  [StatusCarga.FINALIZADA]:   [], // terminal
} as const;

export function validarTransicao(origem: StatusCarga, destino: StatusCarga): void {
  if (!TRANSICOES[origem].includes(destino)) {
    throw new DomainError('TRANSICAO_INVALIDA', `${origem} → ${destino} não é permitida`);
  }
}
```

## 6. Módulos ES6+

- Um módulo por arquivo, exports nomeados, `index.ts` (barrels) por contexto do domínio (`domain/carga/index.ts`);
- Sem dependências circulares — fronteiras de agregados ajudam a manter o grafo de módulos acíclico;
- Build futuro com módulos nativos (Node ESM) e bundler no frontend.

## 7. Async/await em integrações futuras

Casos de uso assíncronos desde já, pois as portas retornam `Promise`:

```typescript
// application/use-cases/RegistrarCargaQuimica.ts (conceitual)
export class RegistrarCargaQuimica {
  constructor(
    private readonly produtos: ProdutoQuimicoRepository,
    private readonly cargas: CargaRepository,
  ) {}

  async executar(input: RegistrarCargaInput): Promise<RegistrarCargaOutput> {
    const produto = await this.produtos.buscarPorId(input.produtoQuimicoId);
    if (!produto) throw new NotFoundError('ProdutoQuimico');
    if (!produto.ativo) throw new DomainError('RN-02', 'Produto químico inativo');

    const carga = CargaQuimica.registrar({ ...input, classificacaoRisco: produto.classeRisco });
    await this.cargas.salvar(carga);
    return { cargaId: carga.id, status: StatusCarga.REGISTRADA };
  }
}
```

## 8. Generics (quando aplicável)

- Repositórios com contrato base genérico: `Repository<TAggregate, TId>`;
- Tipo `Result<T, E>` para operações que retornam sucesso ou erro tipado sem exceção;
- Builders de fixtures de teste genéricos: `Builder<T>`.

```typescript
export type Result<T, E = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface Repository<TAggregate, TId> {
  salvar(agregado: TAggregate): Promise<void>;
  buscarPorId(id: TId): Promise<TAggregate | null>;
}
```

## 9. Tratamento de erros

- Hierarquia em `shared/errors`: `DomainError` (com código da RN, ex.: `'RN-04'`), `NotFoundError`, `ConflictError`, `ValidationError`;
- Domínio lança erros tipados; a camada de interface (futura) mapeia para HTTP (422/404/409/400);
- Erros técnicos nunca são confundidos com erros de negócio — decisão registrada em ADR-005.

## 10. Contratos e tipos compartilhados

- `shared/types`: branded IDs, `Result`, tipos utilitários;
- `application/dtos`: contratos de entrada/saída dos casos de uso — serão a base dos contratos da API futura;
- Enums do domínio exportados para uso futuro no frontend (mesma linguagem ubíqua na tela e no código).

## 11. Configuração TypeScript planejada

```jsonc
// tsconfig.json (resumo das decisões)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "module": "NodeNext",
    "target": "ES2022"
  }
}
```
