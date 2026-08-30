# 1. Entendimento do Domínio e Linguagem Ubíqua

## 1.1 Qual problema o sistema pretende resolver?

O registro de cargas químicas no contexto portuário é feito hoje de forma manual e descentralizada (planilhas, e-mails, documentos físicos). Isso gera:

- **Falta de rastreabilidade**: não é possível saber rapidamente onde está cada carga e em que situação ela se encontra;
- **Risco de segurança**: cargas sem documentação completa ou sem responsável técnico podem ser movimentadas indevidamente;
- **Inconsistência de dados**: informações divergentes entre áreas (operação, documentação, qualidade);
- **Decisões lentas**: bloqueio/liberação de cargas depende de validações manuais, propensas a erro.

O QuimiPort centraliza o domínio da operação e **garante que as regras de segurança sejam aplicadas pelo próprio sistema**, e não por convenção entre pessoas.

## 1.2 Quem são os usuários envolvidos?

| Perfil | Responsabilidades no sistema |
|---|---|
| **Operador Portuário** | Registra cargas, solicita inspeções, acompanha o status das cargas em pátio |
| **Responsável Técnico** | Valida tecnicamente a carga, assina documentos, é atribuído a cada carga |
| **Analista de Documentação** | Registra e valida a documentação obrigatória da carga |
| **Analista de Qualidade** | Acompanha inspeções, resultados e conformidades |
| **Gestor Operacional** | Consulta painéis por status, acompanha bloqueios e liberações |
| **Administrador do Sistema** | Gerencia produtos químicos, áreas de armazenamento e usuários |

## 1.3 Quais informações precisam ser controladas?

- **Produtos químicos**: identificação, classe de risco, número ONU, situação (ativo/inativo);
- **Cargas químicas**: produto associado, quantidade, unidade, responsável técnico, status atual;
- **Documentação da carga**: tipos de documento obrigatórios, prazos de validade, situação de validação;
- **Inspeções**: motivo, resultado, responsável, data;
- **Áreas de armazenamento**: capacidade, tipos de classe de risco permitidos;
- **Histórico da carga**: todas as transições de status, com data, ator e motivo.

## 1.4 Quais processos fazem parte da operação?

1. Cadastro e manutenção do catálogo de produtos químicos;
2. Registro de nova carga química (entrada no pátio);
3. Anexação e validação de documentação obrigatória;
4. Solicitação e execução de inspeção técnica;
5. Liberação ou bloqueio da carga para movimentação;
6. Cancelamento de carga (desistência da operação);
7. Consulta de cargas por status e consulta de histórico.

## 1.5 Quais decisões precisam ser tomadas pelo sistema?

- **Aceitar ou rejeitar** o registro de uma carga (produto válido? quantidade válida? responsável informado?);
- **Liberar ou impedir** a movimentação (documentação completa e válida? inspeção aprovada? carga não bloqueada?);
- **Transicionar status** somente por caminhos permitidos (máquina de estados);
- **Bloquear automaticamente** quando uma regra de segurança for violada.

## 1.6 Quais riscos ou restrições precisam ser considerados?

- Movimentar carga química sem documentação completa gera risco ambiental, legal e operacional;
- Produto inativo não pode gerar novas cargas (descontinuidade do produto);
- Carga bloqueada ou cancelada não pode ser movimentada sob nenhuma hipótese;
- Classes de risco incompatíveis não devem compartilhar a mesma área de armazenamento (evolução futura);
- Toda decisão de bloqueio/liberação deve ficar registrada no histórico (auditoria).

## 1.7 Quais partes do sistema poderão evoluir nas próximas fases?

- Persistência real (banco de dados) e APIs REST;
- Autenticação e autorização por perfil;
- Integração com sistemas externos do porto (agendamento, alfândega);
- Emissão de eventos de domínio (ex.: `CargaLiberada`) para microsserviços;
- Regras avançadas de alocação em áreas de armazenamento por classe de risco;
- Notificações (e-mail/push) em cada transição de status.

## 1.8 Linguagem Ubíqua (Glossário)

Termos que devem ser usados **igualmente** pela equipe de negócio e pelo código:

| Termo | Definição |
|---|---|
| **Produto Químico** | Substância ou mistura catalogada que pode ser movimentada como carga. Possui nome, classe de risco e número ONU |
| **Classe de Risco** | Classificação do perigo do produto conforme regulamentação (ex.: inflamável, tóxico, corrosivo) |
| **Número ONU** | Código de identificação ONU da substância perigosa (ex.: ONU 1993) |
| **Carga Química** | Instância física de um produto químico movimentada no porto, com quantidade, responsável e status |
| **Responsável Técnico** | Profissional habilitado que responde tecnicamente pela carga |
| **Documento da Carga** | Documento obrigatório vinculado à carga (ex.: MSDS/FISPQ, conhecimento de embarque, certificado de inspeção) |
| **Inspeção** | Verificação técnica da carga, com motivo, resultado e conclusão |
| **Área de Armazenamento** | Local físico no pátio onde a carga é acomodada |
| **Liberação** | Ato de autorizar a carga para movimentação portuária após validar regras de segurança |
| **Bloqueio** | Ato de impedir a movimentação da carga por irregularidade ou pendência |
| **Status da Carga** | Etapa atual no ciclo de vida da carga (Registrada, Em Validação, Em Inspeção, Liberada, Bloqueada, Cancelada, Finalizada) |
| **Histórico** | Trilha imutável de eventos e transições de status da carga |
| **Documentação Obrigatória** | Conjunto mínimo de documentos exigido para liberar uma carga |
| **Movimentação** | Deslocamento físico da carga dentro ou fora do porto |

> **Regra prática:** nomes de classes, métodos e variáveis no código usarão esses termos em português técnico (ex.: `CargaQuimica`, `liberarCarga()`, `StatusCarga.LIBERADA`), mantendo a linguagem ubíqua viva no código.
