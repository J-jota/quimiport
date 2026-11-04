# Roteiro do Vídeo Demonstrativo — Fase 2

Roteiro para gravação do vídeo do Tech Challenge (5–10 minutos), cobrindo os itens exigidos no enunciado: contexto, tecnologias, estrutura, Docker, banco de dados, documentação da API, fluxos de produtos e cargas, atualização de status, regra de negócio validada, testes e pipeline.

Dica prática: deixe o banco rodando (`docker compose up -d db`) e a API no ar (`npm run dev`) antes de gravar, e execute a sequência de chamadas uma vez para aquecer o fluxo.

---

## [0:00 — Abertura e contexto]

Olá! Meu nome é Jose Mariano e este é o QuimiPort, o projeto do Tech Challenge da Fase 2 da pós em Full Stack Development. O QuimiPort é uma API backend para gerenciamento de cargas químicas em um contexto portuário, inspirado nas operações do Porto de Santos. A ideia é resolver um problema real: hoje o controle de produtos químicos no porto é manual e descentralizado, o que dificulta a consulta de informações, o acompanhamento do status das cargas e, principalmente, a validação das regras de segurança antes de uma carga ser liberada para movimentação.

## [0:40 — Tecnologias]

A API foi construída em Node.js com TypeScript em modo strict. O framework HTTP é o Fastify, escolhido porque oferece validação de entrada por JSON Schema nativa, logger estruturado embutido e integração oficial com Swagger. A persistência é em PostgreSQL com Prisma como ORM — escolhemos o relacional porque o domínio é naturalmente relacional: uma carga pertence a um produto e a um responsável técnico, e precisamos de transações para garantir a consistência. Os testes são em Vitest, a documentação da API em Swagger e o CI com GitHub Actions.

## [1:20 — Estrutura da aplicação]

*(mostrar a estrutura de pastas no editor)*

A arquitetura segue Clean Architecture com DDD, exatamente como foi planejado na Fase 1. A pasta `domain` concentra as entidades ricas, os agregados, os value objects e a máquina de estados — todas as regras de negócio moram aqui, sem nenhuma dependência de framework ou banco. Em `application` ficam os casos de uso, as portas e os DTOs. Em `infrastructure`, os repositórios Prisma que implementam as portas. E em `interfaces/http`, a camada fina de rotas do Fastify, que só valida o formato da entrada e delega para os casos de uso. As regras de negócio são rastreáveis por código — RN-01 a RN-17 — e cada uma tem teste correspondente.

## [2:10 — Execução com Docker]

*(mostrar o terminal)*

Para subir o ambiente completo, basta um comando: `docker compose up --build`. Isso sobe o PostgreSQL e a API já containerizada. O container da API aplica as migrações do banco automaticamente na inicialização, então ninguém precisa configurar nada manualmente.

*(executar e mostrar os logs subindo)*

## [2:50 — Banco de dados]

A modelagem tem seis tabelas: `produtos_quimicos`, `responsaveis_tecnicos` e `cargas_quimicas`, e as entidades internas do agregado de carga: `documentos_carga`, `inspecoes` e `eventos_historico`. A carga referencia o produto por chave estrangeira e herda a classificação de risco no momento do registro. O histórico é uma tabela append-only: cada transição de status vira um evento imutável, o que nos dá uma trilha de auditoria completa. Os detalhes estão documentados em `docs/fase-2/modelagem-de-dados.md`.

## [3:30 — Documentação da API]

*(abrir o navegador em localhost:3000/docs)*

A documentação é gerada automaticamente em Swagger, na rota `/docs`. Cada endpoint mostra os parâmetros esperados, os exemplos de request e response, os códigos de erro possíveis e as regras de negócio aplicadas — vocês podem ver as RN citadas na descrição de cada operação. Os erros seguem um padrão: 400 para formato inválido, 404 para recurso inexistente, 409 para conflito e 422 para violação de regra de negócio, sempre com o código da regra no corpo da resposta.

## [4:10 — Demonstração: produtos químicos]

*(usar o Swagger ou curl/Postman)*

Vamos ao fluxo. Primeiro cadastro um produto químico — aqui, metanol, com número ONU 1230, classe de risco inflamável e grupo de compatibilidade A. O sistema rejeita cadastro sem nome ou sem classe de risco, como pedem as regras RN-08 e RN-09.

*(executar POST e depois GET na listagem)*

A listagem mostra o produto criado, já com identificador, datas de criação e atualização.

## [4:50 — Demonstração: cargas químicas]

Agora cadastro um responsável técnico, com registro no CRQ, e registro uma carga química associando o produto e o responsável, com quantidade, origem e destino. A carga nasce com status REGISTRADA e já com o primeiro evento no histórico. Se eu tentar registrar uma carga com produto inativo ou quantidade zero, a API bloqueia com 422 e o código da regra.

*(executar POST da carga e GET na listagem com filtro por status)*

## [5:40 — Regra de negócio em destaque: liberação e máquina de estados]

Aqui está o coração do sistema. Vou tentar liberar a carga sem documentação: a API recusa com o erro RN-04 — a liberação exige FISPQ e Conhecimento de Embarque válidos e validados. Então anexo os dois documentos, marco como validados, inicio a análise e agora sim a liberação é aceita.

*(executar a sequência de chamadas)*

O ciclo de vida é controlado por uma máquina de estados: Registrada, Em análise, Em inspeção, Liberada, Em movimentação e Finalizada, com Bloqueada e Cancelada como desvios. Transições proibidas são rejeitadas — por exemplo, uma carga bloqueada não pode entrar em movimentação, e uma carga cancelada não pode ser liberada. E toda transição grava um evento no histórico, com data, ator e motivo, que posso consultar no endpoint de histórico.

*(mostrar GET /cargas-quimicas/:id/historico)*

## [7:00 — Testes]

*(terminal)*

Rodando `npm test`, são 144 testes: unitários de domínio cobrindo cada regra RN e todas as transições da máquina de estados — permitidas e proibidas —, testes de casos de uso, testes end-to-end da API e testes de integração dos repositórios contra um PostgreSQL real.

## [7:40 — CI com GitHub Actions]

E para fechar, o pipeline de CI: a cada push, o GitHub Actions instala as dependências, gera o Prisma Client, roda typecheck, lint, build, a suíte de testes e, com um PostgreSQL em serviço, aplica as migrações e executa os testes de integração.

*(mostrar a aba Actions do repositório)*

## [8:10 — Encerramento]

Essa foi a primeira versão funcional da API do QuimiPort: regras de negócio concentradas no domínio, persistência transacional, documentação viva, testes cobrindo os fluxos críticos e automação desde o primeiro commit. O repositório está no GitHub, com o README completo e os critérios de aceite rastreados em `docs/fase-2`. Obrigado!
