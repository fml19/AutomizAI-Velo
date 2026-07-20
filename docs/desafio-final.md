Desafio Final — Ambiente de Preview com Banco Isolado
Olá QA 👋, Agora chegou a prova de fogo 🔥 pra voc6e obter a sua certifiação em Especialização em automaçao de testes com apoio da IA.

Como eu disse algumas aulas, o grande desafio da automação não está em como buscar um elemento com ou sem ID, com XPATH, CSS Selector e por ai vai. O segredo 🔑 está em como vc lida com ambientes e ecosistema do projeto.

📌 Contexto
Hoje o pipeline de CD (.github/workflows/cd.yml) faz o seguinte fluxo:

Roda os testes unitários
Faz deploy de preview na Vercel
Executa os testes E2E (Playwright) contra a URL de preview
Promove o mesmo build para produção
O problema: existe apenas um projeto Supabase. Isso significa que os testes E2E estão criando pedidos, alterando dados e batendo contra o mesmo banco de produção. Qualquer execução do pipeline polui o banco real, e um teste mal escrito pode até apagar dados de clientes.

A separação preview/produção na Vercel não resolve sozinha — o front-end da preview continua apontando para o Supabase de produção, porque as variáveis VITE*SUPABASE*\* estão iguais nos dois ambientes.

🎯 Objetivo
Criar um segundo projeto Supabase que servirá como ambiente de preview. O ambiente atual permanece como produção. Ao final:

Deploys de preview devem usar o Supabase de preview
O promote para produção deve fazer com que a aplicação passe a usar o Supabase de produção
Os testes E2E devem rodar contra o banco de preview, sem encostar em produção
🧩 Tarefas

1. 🗄️ Provisionar o segundo projeto Supabase
   Criar um novo projeto no supabase.com (ex: velo-sprint-preview)
   Aplicar as migrações do diretório supabase/migrations no novo projeto
   Fazer deploy das Edge Functions do diretório supabase/functions no novo projeto
   Conferir que as policies de RLS estão idênticas ao projeto de produção
   Dica: o CLI do Supabase (yarn supabase link + yarn supabase db push + yarn supabase functions deploy) já está documentado no README. O detalhe é cuidar para qual --project-ref você está apontando antes de cada comando.

2. ⚙️ Configurar variáveis de ambiente na Vercel
   A Vercel permite definir variáveis de ambiente por ambiente (Production, Preview, Development). Você precisa garantir que:

No ambiente Production da Vercel, as VITE*SUPABASE*_ apontem para o projeto Supabase de produção (o atual)
No ambiente Preview da Vercel, as VITE*SUPABASE*_ apontem para o novo projeto Supabase de preview
Variáveis envolvidas: VITE_SUPABASE_URL, VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY.

3. 🔄 Garantir que o pipeline use as variáveis certas
   Olhe com atenção esta parte do workflow:

YAML

- name: Pull Vercel Config
  run: |
  yarn vercel pull --yes \
   --environment=preview \
   --token=$VERCEL_TOKEN \
    --scope=$VERCEL_SCOPE

- name: Build Vercel
  run: yarn vercel build --token=$VERCEL*TOKEN
  Pergunta para refletir: o vercel pull --environment=preview baixa as variáveis de qual ambiente? E o build resultante carrega quais valores das VITE_SUPABASE*\* no bundle?

Atenção: variáveis VITE\_\* são embutidas no bundle em tempo de build. Isso tem implicação direta no passo de promote. Investigue se o vercel promote apenas re-aponta o domínio para um build já existente, ou se gera um novo build.

4. 🚢 Validar o fluxo de promote
   O job promote no workflow atual faz:

YAML
npx vercel@latest promote ${{ needs.build-and-deploy.outputs.deployment-url }} ...
Pense:

Se o build de preview foi gerado com as variáveis do Supabase de preview, ao promover esse mesmo build para produção, com qual banco a aplicação em produção vai conversar?
O comportamento desejado é que produção fale com o Supabase de produção. Como você resolve isso?
Existem mais de um caminho válido. Documente no PR a escolha que você fez e o porquê.

✅ Critérios de Aceitação
Existem dois projetos Supabase distintos, um para preview e outro para produção
Um pedido criado durante a execução dos testes E2E não aparece no banco de produção
Após o promote, a aplicação em produção lê e escreve no banco de produção (e não no de preview)
Os testes E2E continuam passando no pipeline
As migrações e Edge Functions estão sincronizadas entre os dois projetos
As secrets/variáveis sensíveis não foram commitadas no repositório
💡 Dicas e Armadilhas
Edge Functions: lembre-se que o segundo projeto começa vazio. Sem deploy das functions, chamadas do front vão dar 404.
supabase link: o CLI guarda o último projeto vinculado. Antes de rodar db push ou functions deploy, confirme com yarn supabase projects list qual está ativo.
RLS: se você criou o projeto novo "do zero", as policies precisam vir das migrações. Não recrie tabelas pela UI — confie nas migrações para manter os ambientes idênticos.
VITE*\* no build: variáveis com prefixo VITE* viram strings literais dentro do JavaScript final. Você não consegue trocá-las "em runtime" só renomeando domínios.
TestDino / Playwright report: como o job de E2E publica relatório, certifique-se de que ele aponta para a URL correta após sua mudança.
📬 Entrega
Seu código no Github Aqui pra eu avaliar com o Push e funcionando conforme os critérios de aceitação acima.

Bom trabalho! 🚀

---

## 📋 Plano de Implementação dos Ajustes

> **Status:** planejamento concluído. Os passos abaixo somente devem ser executados após aprovação explícita. Nesta etapa, nenhuma configuração do Supabase, Vercel, GitHub Actions ou código da aplicação deve ser alterada.

### 1. Levantar e registrar o estado atual

- Identificar o projeto Supabase atualmente utilizado em produção.
- Conferir as migrações existentes em `supabase/migrations`.
- Conferir as Edge Functions existentes em `supabase/functions`.
- Listar as variáveis configuradas nos ambientes Preview e Production da Vercel, sem copiar seus valores para o repositório.
- Identificar quais GitHub Secrets são usados atualmente pelo workflow.
- Registrar uma execução de referência do pipeline antes das mudanças.

### 2. Criar o projeto Supabase de preview

- Criar um segundo projeto no Supabase, exclusivo para preview e testes E2E.
- Guardar com segurança o project ref, a URL, a chave pública e a string de conexão do novo projeto.
- Não reutilizar senhas, service role keys ou conexões do projeto de produção.
- Confirmar visualmente que os dois projetos possuem identificadores distintos.

### 3. Sincronizar banco, RLS e Edge Functions

- Autenticar o Supabase CLI.
- Vincular temporariamente o CLI ao project ref de preview.
- Confirmar o projeto ativo antes de executar qualquer comando de escrita.
- Aplicar todas as migrações com `yarn supabase db push`.
- Fazer deploy de todas as Edge Functions necessárias.
- Comparar tabelas, índices, triggers e policies de RLS entre preview e produção.
- Executar uma validação funcional básica no projeto de preview.
- Confirmar novamente o projeto vinculado antes de qualquer operação futura, pois `supabase link` mantém o último projeto selecionado.

### 4. Separar as variáveis por ambiente na Vercel

- Configurar no ambiente **Preview** da Vercel:
  - `VITE_SUPABASE_URL` com a URL do Supabase de preview.
  - `VITE_SUPABASE_PROJECT_ID` com o project ref de preview.
  - `VITE_SUPABASE_PUBLISHABLE_KEY` com a chave pública de preview.
- Configurar no ambiente **Production** da Vercel:
  - `VITE_SUPABASE_URL` com a URL do Supabase de produção.
  - `VITE_SUPABASE_PROJECT_ID` com o project ref de produção.
  - `VITE_SUPABASE_PUBLISHABLE_KEY` com a chave pública de produção.
- Conferir que nenhuma variável de Preview está habilitada para Production e vice-versa.
- Gerar novos deployments após alterar variáveis, pois mudanças de ambiente não afetam builds já existentes.

### 5. Criar os GitHub Secrets exclusivos de preview

- Criar `SUPABASE_PREVIEW_DATABASE_URL` com a conexão do banco de preview usada pelos testes.
- Criar `SUPABASE_PREVIEW_URL` com a URL pública do projeto de preview.
- Criar `SUPABASE_PREVIEW_PROJECT_ID` com o project ref de preview.
- Criar `SUPABASE_PREVIEW_PUBLISHABLE_KEY` com a chave pública de preview.
- Manter `TD_TOKEN`, `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` e `VERCEL_ORGID` conforme suas finalidades atuais.
- Não registrar valores de secrets em logs, documentação, commits ou comentários do PR.

### 6. Remover o job local redundante de Playwright

- Remover `testLOCALHOST`, pois ele executa a suíte completa antes da criação do deployment de Preview.
- Manter uma única regressão E2E no job `e2e-tests`, executada contra a URL real de Preview.
- Evitar instalação duplicada de dependências e navegadores no mesmo pipeline.
- Preservar os relatórios HTML e JSON no job `e2e-tests`.

### 7. Ajustar o build e o deploy de Preview

- Remover do ambiente do job `build-and-deploy` as variáveis `VITE_SUPABASE_*` vindas diretamente do GitHub.
- Manter `vercel pull --environment=preview` para vincular o projeto e selecionar o ambiente de preview.
- Fazer build e deploy remotos com `vercel deploy --target=preview`, permitindo que a Vercel disponibilize as variáveis `Sensitive` durante o build.
- Não usar `vercel build` local nem `--prebuilt`, pois valores `Sensitive` não são descriptografados no GitHub Runner.
- Preservar a URL gerada como output para os testes E2E.
- Inspecionar o bundle ou o deployment para confirmar que ele referencia somente o Supabase de preview.

### 8. Ajustar os testes E2E e o TestDino

- Executar os testes contra a URL retornada pelo deployment de preview.
- Mapear `DATABASE_URL` para o secret do banco de preview em todas as etapas que criam, consultam ou removem dados.
- Manter `TESTDINO_TOKEN: ${{ secrets.TD_TOKEN }}` na etapa de publicação do TestDino.
- Manter o endpoint `https://reporter.testdino.com` na configuração do reporter.
- Confirmar que o relatório JSON continua sendo gerado em `playwright-report/report.json`.
- Confirmar que os resultados enviados ao TestDino correspondem à URL de preview.

### 9. Criar um build separado para Production

- Substituir a promoção direta do artefato prebuilt de preview por uma etapa explícita de produção.
- Fazer checkout do mesmo commit que passou pelos testes E2E.
- Executar `vercel pull --environment=production`.
- Executar `vercel deploy --prod` somente após o sucesso dos testes, criando um novo build remoto com as variáveis `Sensitive` de Production.
- Não reutilizar o deployment nem o bundle criado para Preview.
- Não fornecer variáveis `VITE_SUPABASE_*` manualmente nesse job; elas devem vir do ambiente Production da Vercel.
- Registrar no PR que essa estratégia foi escolhida para tornar explícita a separação entre os bundles de Preview e Production.

### 10. Validar o isolamento dos dados

- Criar um pedido identificável durante o teste E2E no ambiente de preview.
- Confirmar que o pedido aparece no Supabase de preview.
- Confirmar que o mesmo pedido não aparece no Supabase de produção.
- Remover os dados de teste do banco de preview ao final da execução, quando aplicável.
- Verificar que nenhum teste possui conexão direta ou fallback para o banco de produção.

### 11. Validar o deployment de produção

- Confirmar que o pipeline só inicia o build de produção após todos os testes E2E passarem.
- Acessar o domínio de produção após o deploy.
- Criar ou consultar um registro controlado em produção.
- Confirmar que a operação ocorreu exclusivamente no Supabase de produção.
- Verificar que URLs, chaves públicas e chamadas de Edge Functions pertencem ao projeto correto.

### 12. Validar migrações, functions e RLS

- Comparar o histórico de migrações aplicado nos dois projetos.
- Testar as Edge Functions no ambiente de preview.
- Conferir respostas esperadas para usuários autenticados e não autenticados.
- Validar que as policies de RLS impedem acessos indevidos nos dois ambientes.
- Documentar qualquer diferença intencional entre os ambientes.

### 13. Executar a validação final do pipeline

- Rodar os testes unitários.
- Gerar e publicar o Preview Deployment.
- Rodar os testes E2E contra a URL de preview.
- Publicar os relatórios como artifact e no TestDino.
- Criar o build separado de Production.
- Fazer o deploy de Production.
- Confirmar que o job de produção não executa quando qualquer etapa obrigatória falha.

### 14. Revisar segurança e versionamento

- Verificar `git diff` antes do commit.
- Confirmar que `.env`, `.env.*`, `.vercel/` e outros arquivos sensíveis continuam ignorados.
- Procurar tokens, URLs privadas, strings de conexão e chaves que possam ter sido adicionados acidentalmente.
- Rotacionar qualquer credencial exposta durante testes ou capturas de tela.
- Garantir que apenas nomes de variáveis, nunca seus valores, estejam documentados.

### 15. Documentar e entregar

- Explicar no PR a estratégia de builds separados para Preview e Production.
- Anexar evidências dos testes e dos dois deployments.
- Registrar a comprovação de que os pedidos de teste não chegaram ao banco de produção.
- Registrar a validação das migrações, Edge Functions e policies de RLS.
- Incluir instruções de rollback para o deployment de produção.
- Conferir todos os critérios de aceitação antes de solicitar a avaliação.

---

## 🧾 Registro de Execução — Etapa 1

**Data do levantamento:** 20/07/2026
**Escopo executado:** inventário e registro do estado atual.
**Alterações externas realizadas:** nenhuma.

### Repositório e referência inicial

- Branch atual: `main`.
- Commit de referência: `6fc33af75f20366606c13b6a3492c9fcbb74f9d6` (`6fc33af`).
- Mensagem do commit: `ajuste de variavel TestDino Report`.
- Data do commit: `20/07/2026 11:26:50 -03:00`.
- O worktree não apresentava alterações rastreadas no início do levantamento.
- A pasta `docs/` está ignorada pelo `.gitignore`; este registro permanece local até que seu versionamento seja decidido.

### Estado atual do Supabase

- A conta autenticada possui somente um projeto Supabase visível.
- Projeto ativo: `VelôFML`.
- Project ref utilizado pelo front-end local: `zfxbozdbybolusncsewp`.
- O mesmo project ref está persistido em `supabase/.temp/project-ref` e aparece como projeto vinculado no Supabase CLI.
- O projeto está na região `sa-east-1` e foi reportado pelo CLI como `ACTIVE_HEALTHY`.
- Ainda não existe um segundo projeto Supabase para preview.
- `supabase/config.toml` declara `project_id = "ylhtbnzypxtmlvvhbtyo"`, diferente do projeto efetivamente vinculado e utilizado pelo front-end (`zfxbozdbybolusncsewp`). A divergência foi analisada e não representa um segundo vínculo remoto: segundo a documentação oficial, o `project_id` na raiz do `config.toml` é um identificador da stack local, usado para distinguir projetos Supabase executados no mesmo host. Ele não seleciona o projeto hospedado usado por `db push` ou pelo deploy de functions. Por decisão do projeto, esse valor será mantido sem alteração por enquanto.
- A variável local `DATABASE_URL` está configurada e utiliza o pooler do Supabase na região `sa-east-1`; usuário, senha e string completa não foram registrados.

### Migrações, RLS e estrutura conhecida

- Foram encontradas quatro migrações em `supabase/migrations`:
  - `20251221161820_957401d5-9b96-4699-ba74-51da5efe4ba6.sql`.
  - `20251221163213_f77c793b-908a-4bcc-847c-c791e8842090.sql`.
  - `20251221205335_f4603b36-ef43-4d41-aba7-0f0a0ed0fe1b.sql`.
  - `20251221205414_b63a828a-8a04-4a38-80c2-3336158d1161.sql`.
- As migrações criam e evoluem a tabela `public.orders`.
- RLS é habilitado para `public.orders`.
- Policies encontradas nas migrações:
  - `Anyone can view orders by order number`.
  - `Anyone can create orders`.
- Existe a função `public.update_updated_at_column()`.
- Existe o trigger `update_orders_updated_at`.
- As migrações posteriores adicionam `optionals`, removem `interior_color` e renomeiam `exterior_color` para `color`.

### Edge Functions

- Foi encontrada uma Edge Function: `supabase/functions/credit-analysis/index.ts`.
- A função está declarada em `supabase/config.toml` como `credit-analysis`.
- A configuração atual utiliza `verify_jwt = false`.
- O deploy efetivo e a versão remota da função ainda não foram comparados nesta etapa.

### Estado atual da Vercel

- Conta autenticada no CLI: `vetfml-4275`.
- Projeto consultado: `fernando-ml/automiz-ai-velo`.
- Ambiente **Preview**: nenhuma variável de ambiente cadastrada.
- Ambiente **Production**:
  - `VITE_SUPABASE_URL` cadastrada como valor criptografado.
  - `VITE_SUPABASE_PUBLISHABLE_KEY` cadastrada como valor criptografado.
- `VITE_SUPABASE_PROJECT_ID` não foi encontrada em Preview nem em Production.
- O estado atual não atende ao requisito de separar as configurações Supabase entre Preview e Production.
- Nenhum valor das variáveis da Vercel foi baixado ou registrado neste documento.

### GitHub Secrets referenciados pelo workflow

O workflow atual referencia os seguintes nomes, sem expor seus valores:

- `DATABASE_URL`.
- `TD_TOKEN`.
- `VERCEL_ORGID`.
- `VERCEL_PROJECT_ID`.
- `VERCEL_TOKEN`.
- `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `VITE_SUPABASE_URL`.

Ainda não existem referências no workflow aos secrets exclusivos de preview definidos no plano (`SUPABASE_PREVIEW_*`).

### Fluxo atual do pipeline

- Executa testes unitários.
- Executa uma suíte Playwright contra localhost.
- Faz `vercel pull --environment=preview`.
- Gera um build Vercel sem target explícito no comando de build.
- Publica um deployment prebuilt com target `preview`.
- Executa os testes E2E contra a URL gerada.
- Publica artifacts e resultados no TestDino.
- Promove o deployment após o sucesso dos testes.
- O job `build-and-deploy` ainda injeta `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` a partir dos GitHub Secrets, o que pode sobrescrever ou conflitar com as variáveis obtidas da Vercel para Preview.
- Os testes E2E ainda utilizam o secret genérico `DATABASE_URL`, sem indicação explícita de que seja uma conexão exclusiva de preview.

### Execução de referência disponível

- Execução registrada na evidência fornecida: GitHub Actions run `29749503508`.
- Resultado observado: `Unit Tests`, `testLOCALHOST` e `Build & Deploy Vercel Preview` concluídos; `Run E2E Tests` falhou; `Promote to Production` não foi executado.
- A falha destacada ocorreu no passo `Publish TestDino Report` por ausência do token no nome esperado e tentativa de iniciar o Vite sem as variáveis obrigatórias.
- Essa evidência é anterior ao commit de referência que ajustou o mapeamento do TestDino.
- A API pública do GitHub não permitiu confirmar metadados adicionais dessa execução durante o levantamento por limite de requisições (`403 rate limit exceeded`).

### Pendências antes da Etapa 2

- [x] Confirmado pelo responsável do projeto que `zfxbozdbybolusncsewp` é oficialmente o projeto de produção e deve ser preservado.
- [x] Analisado o project ID `ylhtbnzypxtmlvvhbtyo` presente em `supabase/config.toml`. Ele identifica a stack local e não controla o vínculo com o projeto hospedado. Foi decidido mantê-lo sem alteração por enquanto.
- [x] A condição para criar o segundo projeto Supabase foi atendida. A criação permanece reservada para a Etapa 2 e ainda não foi executada.
- [x] Nenhum comando `supabase link`, `db push` ou `functions deploy` foi executado durante a resolução das pendências.

### Decisão operacional para a Etapa 2

- O projeto `zfxbozdbybolusncsewp` será tratado como Production e não receberá dados ou alterações destinados ao ambiente de testes.
- O segundo projeto será criado exclusivamente para Preview.
- Após a criação, o vínculo será feito com `supabase link --project-ref <preview-project-ref>` usando explicitamente o novo ref.
- Antes de qualquer escrita remota, o projeto ativo será conferido com `yarn supabase projects list`.
- Migrações serão aplicadas com destino linked explícito e somente depois da conferência do novo ref.
- Edge Functions serão publicadas informando explicitamente o project ref de Preview sempre que o comando suportar essa opção.
- O valor `ylhtbnzypxtmlvvhbtyo` do `config.toml` não será usado como referência para operações remotas.
- Se o CLI indicar que o projeto de produção está vinculado antes de uma operação de escrita, a execução deverá ser interrompida imediatamente.

### Resultado da Etapa 1

- Inventário local concluído.
- Supabase consultado em modo somente leitura.
- Vercel consultada em modo somente leitura.
- GitHub Secrets identificados apenas pelos nomes usados no workflow.
- Execução de referência registrada a partir da evidência disponível.
- Nenhum projeto, variável, secret, migration, function, workflow ou deployment foi alterado.

---

## 🧾 Registro de Execução — Etapa 2

**Data da execução:** 20/07/2026
**Escopo executado:** provisionamento e preparação do Supabase de Preview.
**Projeto Production preservado:** `zfxbozdbybolusncsewp` (`VelôFML`).
**Projeto Preview preparado:** `lxpvdsvxpfbetcogaeba` (`Velô-PREVIEW`).

### Validações anteriores à escrita

- O `.env` efetivo foi validado sem exposição de credenciais.
- `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL` e `DATABASE_URL` apontam para `lxpvdsvxpfbetcogaeba`.
- Não existem mais variáveis ativas duplicadas no `.env`; as referências antigas de Production permanecem apenas comentadas temporariamente.
- Os dois projetos foram consultados antes do vínculo e estavam `ACTIVE_HEALTHY`.
- Antes da alteração, Production estava `linked: true` e Preview estava `linked: false`.

### Vínculo seguro do CLI

- Foi executado `yarn supabase link --project-ref lxpvdsvxpfbetcogaeba`.
- Após o comando, `Velô-PREVIEW` passou a aparecer como `linked: true`.
- Production passou a aparecer como `linked: false`.
- `supabase/.temp/project-ref` foi conferido e contém `lxpvdsvxpfbetcogaeba`.
- Nenhuma escrita foi iniciada antes dessas confirmações.

### Aplicação das migrações

- Primeiro foi executado `yarn supabase db push --linked --dry-run`.
- O dry-run listou somente as quatro migrações versionadas esperadas.
- Depois da validação do destino, foi executado `yarn supabase db push --linked --yes`.
- As quatro migrações foram aplicadas com sucesso no Preview.
- `yarn supabase migration list --linked` confirmou correspondência completa entre os históricos Local e Remote:
  - `20251221161820`.
  - `20251221163213`.
  - `20251221205335`.
  - `20251221205414`.

### Validação do schema e RLS

- A tabela `public.orders` foi criada no Preview.
- RLS está habilitado para `public.orders`.
- Policies confirmadas remotamente:
  - `Anyone can create orders` para `INSERT`.
  - `Anyone can view orders by order number` para `SELECT`.
- Colunas confirmadas remotamente:
  - `id`.
  - `order_number`.
  - `color`.
  - `wheel_type`.
  - `customer_name`.
  - `customer_email`.
  - `customer_phone`.
  - `customer_cpf`.
  - `payment_method`.
  - `total_price`.
  - `status`.
  - `created_at`.
  - `updated_at`.
  - `optionals`.

### Deploy e validação da Edge Function

- Foi executado `yarn supabase functions deploy credit-analysis --project-ref lxpvdsvxpfbetcogaeba`.
- A function `credit-analysis` foi publicada exclusivamente no Preview.
- O estado remoto foi confirmado como `ACTIVE`, versão `1`.
- A configuração remota foi confirmada com `verify_jwt: false`, igual ao `config.toml`.
- O aviso local de Docker indisponível não impediu o deploy; o CLI enviou diretamente o arquivo da function.
- Uma chamada segura com CPF sintético foi enviada ao endpoint de Preview.
- A function respondeu em modo mock com `status: Done` e `score: 420`.

### Resultado da Etapa 2

- Segundo projeto Supabase criado e identificado como Preview.
- Production permaneceu preservado e desvinculado durante todas as escritas.
- Migrações sincronizadas no Preview.
- Tabela, colunas, RLS e policies validados remotamente.
- Edge Function publicada e validada funcionalmente.
- Nenhum secret foi exibido, documentado ou commitado.
- Configuração da Vercel ainda não iniciada; permanece reservada para a próxima etapa.

---

## 🧾 Registro de Execução — Etapa 3

**Status:** concluída durante a preparação e validação do Supabase de Preview na Etapa 2.

- Migrações Local e Remote sincronizadas.
- Tabela `public.orders` validada remotamente.
- RLS confirmado como ativo.
- Policies de `SELECT` e `INSERT` confirmadas.
- Edge Function `credit-analysis` publicada e validada.
- Configuração `verify_jwt = false` confirmada local e remotamente.
- Chamada funcional segura concluída com resposta mock esperada.
- Production permaneceu preservado durante todas as operações.

---

## 🧾 Registro de Execução — Etapa 4

**Data da execução:** 20/07/2026
**Escopo executado:** separação das variáveis Supabase entre Preview e Production na Vercel.

### Estado anterior

- O ambiente Preview da Vercel não possuía variáveis cadastradas.
- O ambiente Production possuía `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `VITE_SUPABASE_PROJECT_ID` estava ausente em Production.
- Os valores ativos do `.env` foram validados e pertenciam ao projeto Preview `lxpvdsvxpfbetcogaeba`.

### Variáveis configuradas em Preview

- `VITE_SUPABASE_PROJECT_ID` com o project ref de Preview.
- `VITE_SUPABASE_URL` com a URL do Supabase de Preview.
- `VITE_SUPABASE_PUBLISHABLE_KEY` com a publishable key de Preview.
- Os valores foram enviados diretamente do `.env` local para a Vercel sem impressão no terminal ou registro neste documento.
- As três variáveis foram armazenadas pela Vercel como `Sensitive` e aparecem associadas somente ao ambiente Preview.

### Variáveis preservadas e completadas em Production

- `VITE_SUPABASE_URL` existente foi preservada sem alteração.
- `VITE_SUPABASE_PUBLISHABLE_KEY` existente foi preservada sem alteração.
- `VITE_SUPABASE_PROJECT_ID` foi adicionada com o project ref de Production `zfxbozdbybolusncsewp`.
- As três variáveis aparecem associadas somente ao ambiente Production.

### Validação final da Vercel

- Preview contém exatamente os três nomes esperados:
  - `VITE_SUPABASE_PROJECT_ID`.
  - `VITE_SUPABASE_URL`.
  - `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Production contém exatamente os mesmos três nomes, com valores próprios do ambiente.
- Nenhum valor sensível foi baixado ou documentado durante a conferência final.
- O alerta da Vercel sobre variáveis `VITE_*` serem visíveis no navegador é esperado, pois elas são incorporadas ao bundle do front-end.
- A publishable key não substitui RLS; as policies continuam sendo o controle de acesso efetivo aos dados.

### Resultado da Etapa 4

- Ambientes Preview e Production possuem configurações Supabase separadas na Vercel.
- Preview aponta para `lxpvdsvxpfbetcogaeba`.
- Production aponta para `zfxbozdbybolusncsewp`.
- Nenhuma variável existente de Production foi sobrescrita.
- Nenhum deployment novo foi criado nesta etapa.
- GitHub Secrets e workflow ainda não foram alterados; permanecem para a próxima etapa.

---

## 🧪 Validação Intermediária — Cenário Único de Isolamento

**Data da execução:** 20/07/2026
**Cenário:** `CT05 - deve criar um pedido aprovado com pagamento à vista`.
**Arquivo:** `playwright/e2e/checkout.spec.ts`.
**Workers:** `1`.

### Confirmações anteriores ao teste

- Front-end efetivo apontando para Preview `lxpvdsvxpfbetcogaeba`.
- `DATABASE_URL` efetiva apontando para Preview `lxpvdsvxpfbetcogaeba`.
- As duas referências foram comparadas programaticamente e correspondiam.
- A conexão comentada de Production foi usada somente para consultas de contagem, sem escrita.

### Contagem inicial do cliente sintético

- Preview: `0` pedidos para `fernando.ml.ct05@example.com`.
- Production: `1` pedido histórico para o mesmo cliente.

### Resultado do Playwright e TestDino

- Resultado: `1 passed`.
- Duração do cenário: `10.8s`.
- Status TestDino: `PASSED`.
- TestDino Run ID: `dccb2aa5-8266-4f51-8ec4-0f4a0cb14b54`.
- Eventos `run:begin` e `run:end` entregues com sucesso.
- O aviso `TimeoutNegativeWarning` ocorreu após a conclusão e não afetou o teste nem o envio.

### Contagem posterior ao teste

- Preview: `1` pedido.
- Production: `1` pedido.
- A contagem de Production permaneceu inalterada.
- O novo pedido foi criado exclusivamente no banco de Preview.

### Conclusão

- A separação local entre Preview e Production foi comprovada para o cenário CT05.
- O front-end e as operações diretas de preparação de dados utilizaram o mesmo projeto Preview.
- Nenhuma escrita causada por essa execução chegou ao banco de Production.
- O pedido de teste foi mantido temporariamente no Preview como evidência e será removido por uma execução futura do próprio cenário ou durante a limpeza planejada.

---

## 🔐 Registro de Execução — Etapa 5

**Data da execução:** 20/07/2026
**Escopo executado:** criação dos GitHub Secrets exclusivos de Preview.

### Secrets validados

- `SUPABASE_PREVIEW_DATABASE_URL`.
- `SUPABASE_PREVIEW_URL`.
- `SUPABASE_PREVIEW_PROJECT_ID`.
- `SUPABASE_PREVIEW_PUBLISHABLE_KEY`.
- Os nomes foram confirmados visualmente na configuração do repositório.
- Os valores permaneceram protegidos e não foram registrados neste documento.
- Os secrets genéricos existentes foram preservados para as etapas seguintes.

### Resultado da Etapa 5

- Os quatro secrets exclusivos de Preview estão disponíveis no GitHub Actions.
- Nenhum secret existente foi removido ou alterado nesta etapa.

---

## 🧪 Registro de Execução — Etapa 6

**Data da execução:** 20/07/2026
**Escopo executado:** isolamento do job local de Playwright no ambiente Preview.

### Ajustes no job `testLOCALHOST`

- `DATABASE_URL` passou a usar `${{ secrets.SUPABASE_PREVIEW_DATABASE_URL }}`.
- `VITE_SUPABASE_URL` passou a usar `${{ secrets.SUPABASE_PREVIEW_URL }}`.
- `VITE_SUPABASE_PROJECT_ID` passou a usar `${{ secrets.SUPABASE_PREVIEW_PROJECT_ID }}`.
- `VITE_SUPABASE_PUBLISHABLE_KEY` passou a usar `${{ secrets.SUPABASE_PREVIEW_PUBLISHABLE_KEY }}`.
- A publicação do relatório HTML em `playwright-report/` foi preservada.

### Resultado da Etapa 6

- O job `testLOCALHOST` não referencia mais credenciais genéricas do Supabase.
- Os jobs `build-and-deploy`, `e2e-tests` e `promote` não foram alterados nesta etapa.

---

## 🚀 Registro de Execução — Etapa 7

**Data da execução:** 20/07/2026
**Escopo executado:** ajuste do build e deploy de Preview na Vercel.

### Ajustes no job `build-and-deploy`

- As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` vindas dos GitHub Secrets genéricos foram removidas do ambiente do job.
- `vercel pull --environment=preview` foi preservado como fonte das configurações do ambiente Preview.
- O comando de build passou a usar explicitamente `vercel build --target=preview`.
- O deploy prebuilt permaneceu configurado com `vercel deploy --prebuilt --target=preview`.
- A URL gerada pelo deployment continua sendo gravada no output `deploument-url` e disponibilizada ao job de testes E2E.

### Resultado da Etapa 7

- O build de Preview não recebe mais variáveis Supabase genéricas diretamente do GitHub Actions.
- A configuração Supabase do bundle passa a vir do ambiente Preview configurado na Vercel.
- Nenhum comando de promoção ou build de Production foi alterado nesta etapa.
- A confirmação dinâmica do bundle e do deployment será feita na execução do workflow após commit e push.

---

## 📊 Registro de Execução — Etapa 8

**Data da execução:** 20/07/2026
**Escopo executado:** isolamento dos testes E2E e publicação dos resultados no TestDino.

### Ajustes no job `e2e-tests`

- A URL dos testes permanece vinculada ao output do deployment de Preview.
- `DATABASE_URL` passou a usar `${{ secrets.SUPABASE_PREVIEW_DATABASE_URL }}`.
- `TESTDINO_TOKEN` permanece protegido em `${{ secrets.TD_TOKEN }}`.
- A regressão e a publicação no TestDino foram consolidadas em uma única execução do Playwright.
- A segunda execução redundante da suíte foi removida.
- O upload do diretório `playwright-report` como artifact foi preservado.

### Configuração do reporter preservada

- Endpoint TestDino: `https://reporter.testdino.com`.
- Relatório HTML: `playwright-report/`.
- Relatório JSON: `playwright-report/report.json`.

### Resultado da Etapa 8

- Os testes E2E não referenciam mais o secret genérico `DATABASE_URL`.
- A mesma execução testa o deployment de Preview, utiliza o banco de Preview, gera os relatórios e envia o resultado ao TestDino.
- A validação dinâmica da URL, do artifact e do envio será realizada após commit e push.

---

## 🧪 Validação Intermediária — Etapa 8 com Cenário Único

**Data da execução:** 20/07/2026
**Cenário:** `CT05 - deve criar um pedido aprovado com pagamento à vista`.
**Arquivo:** `playwright/e2e/checkout.spec.ts`.
**Workers:** `1`.

### Confirmações anteriores ao teste

- O front-end local estava configurado para o projeto Preview `lxpvdsvxpfbetcogaeba`.
- A conexão ativa `DATABASE_URL` correspondia ao mesmo projeto Preview.
- A conexão comentada de Production correspondia ao projeto `zfxbozdbybolusncsewp` e foi utilizada somente para consultas de contagem.
- Nenhuma operação de escrita foi executada diretamente em Production.

### Contagem inicial do cliente sintético

- Cliente consultado: `fernando.ml.ct05@example.com`.
- Preview: `1` pedido.
- Production: `1` pedido histórico.

### Resultado do Playwright e TestDino

- Comando executado com filtro exclusivo para o cenário CT05 e `--workers=1`.
- Resultado: `1 passed`.
- Duração do cenário: `13.0s`.
- Status TestDino: `PASSED`.
- TestDino Run ID: `a76dd768-ad7c-4451-8d3c-53e505b6d01e`.
- Os eventos `run:begin` e `run:end` foram entregues com sucesso.
- O aviso `TimeoutNegativeWarning` ocorreu após a entrega do resultado e não afetou o teste.

### Relatórios gerados

- Relatório JSON: `playwright-report/report.json`, com `4.515` bytes.
- Relatório HTML: `playwright-report/index.html`, com `529.458` bytes.
- Os dois arquivos foram atualizados em 20/07/2026 às 15:32:39.

### Contagem posterior ao teste

- Preview: `1` pedido.
- Production: `1` pedido.
- O cenário removeu e recriou somente seu registro sintético no Preview.
- A contagem de Production permaneceu inalterada.

### Conclusão

- O cenário CT05 foi executado com sucesso usando o ambiente local de Preview.
- Os relatórios HTML e JSON foram gerados nos caminhos esperados.
- O resultado foi publicado com sucesso no TestDino.
- A execução confirmou novamente que nenhuma escrita do cenário chegou ao banco de Production.
- A validação dos novos GitHub Secrets e da URL dinâmica do deployment ainda depende da execução do workflow após commit e push.

---

## 🏭 Registro de Execução — Etapa 9

**Data da execução:** 20/07/2026
**Escopo executado:** criação de um build e deployment separados para Production.

### Estratégia adotada

- A promoção direta do bundle prebuilt de Preview foi removida.
- O job de Production continua dependendo do sucesso de `build-and-deploy` e `e2e-tests`.
- O deploy de Production foi limitado a eventos `push`; pull requests não publicam em Production.
- O job faz checkout explícito de `${{ github.sha }}`, garantindo o uso do commit testado.
- `vercel pull --environment=production` baixa as configurações próprias de Production.
- `vercel build --prod` cria um bundle novo com as variáveis `VITE_*` de Production.
- `vercel deploy --prebuilt --prod` publica somente esse bundle de Production.
- Nenhuma variável `VITE_SUPABASE_*` é fornecida manualmente pelo GitHub Actions nesse job.
- A URL resultante é exposta pelo output `deployment-url` para validações posteriores.

### Resultado da Etapa 9

- Preview e Production deixam de compartilhar o mesmo bundle Vite.
- O bundle testado em Preview não é promovido diretamente para o domínio de Production.
- Production passa a receber um build próprio após o sucesso dos testes E2E.
- A execução real e a URL de Production serão validadas após commit e push.

---

## 🔒 Registro de Execução — Etapa 10

**Data da execução:** 20/07/2026
**Escopo executado:** validação exata do isolamento e limpeza do dado sintético no Preview.

### Pedido utilizado como evidência

- Cenário de origem: `CT05 - deve criar um pedido aprovado com pagamento à vista`.
- Cliente sintético: `fernando.ml.ct05@example.com`.
- Identificador exato recuperado do Preview: `VLO-1POPRZ`.
- Preview validado: `lxpvdsvxpfbetcogaeba`.
- Production consultado somente para leitura: `zfxbozdbybolusncsewp`.

### Validação anterior à limpeza

- Pedido `VLO-1POPRZ` no Preview: `1` ocorrência.
- Mesmo pedido em Production: `0` ocorrências.
- A comparação foi feita pelo `order_number`, evitando ambiguidade causada por registros históricos com o mesmo e-mail.

### Limpeza controlada

- Foi removido exatamente um registro com o `order_number` e e-mail sintético esperados.
- A exclusão foi executada somente através da conexão ativa de Preview.
- Nenhum comando de escrita foi enviado para Production.
- Após a limpeza, o pedido possuía `0` ocorrências no Preview e `0` em Production.

### Auditoria de conexões e fallbacks

- Os testes acessam o banco exclusivamente por `process.env.DATABASE_URL`.
- A ausência de `DATABASE_URL` causa erro explícito; não existe fallback para outra conexão.
- O cliente da aplicação utiliza apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` fornecidas durante o build.
- Não foram encontrados fallbacks para URLs, project refs ou credenciais de Production nos testes, cliente Supabase ou workflow.
- A única referência rastreada ao project ref de Production fora da documentação deste desafio está no `README.md`, em uma instrução operacional de `supabase link`; ela não participa da execução da aplicação ou dos testes.

### Resultado da Etapa 10

- O pedido criado pelo teste existiu exclusivamente no banco de Preview.
- Production permaneceu sem o identificador criado pelo cenário.
- O dado sintético foi removido do Preview após a coleta das evidências.
- O código de runtime e os testes não possuem conexão direta nem fallback para Production.

---

## 🛠️ Correção do Pipeline — Build Remoto na Vercel

**Data da execução:** 20/07/2026
**Run com falha:** `29769146819`.
**Job:** `Build & Deploy Vercel Preview`.

### Falha observada

- `vercel pull --environment=preview` foi concluído.
- O comando local `vercel build --target=preview` falhou durante a carga do `vite.config.ts`.
- Variáveis ausentes: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- As seis variáveis `VITE_SUPABASE_*` de Preview e Production estavam cadastradas na Vercel como `Sensitive`.
- Valores `Sensitive` não ficam legíveis para download e são descriptografados somente nos ambientes de build da Vercel.

### Correção adotada

- Preview passou a usar `vercel deploy --target=preview` sem `--prebuilt`.
- Production passou a usar `vercel deploy --prod` sem `--prebuilt`.
- Os dois builds serão executados remotamente e de forma independente pela Vercel.
- Nenhuma variável `VITE_SUPABASE_*` será duplicada ou injetada manualmente pelo GitHub Actions.
- O isolamento continua definido pelos ambientes Preview e Production configurados na Vercel.

### Validação pendente

- Executar novamente o pipeline.
- Confirmar o build remoto de Preview, os testes E2E e o envio ao TestDino.
- Confirmar que o build remoto de Production inicia somente após o sucesso dos testes.

---

## 🧹 Simplificação do Pipeline — Remoção do `testLOCALHOST`

**Data da execução:** 20/07/2026

### Motivo

- O job executava a suíte Playwright completa antes da criação do deployment de Preview.
- O job `e2e-tests` já cobre a regressão contra a URL real de Preview.
- A duplicação aumentava o tempo do pipeline e não validava o artefato que seria publicado.

### Ajuste

- O job `testLOCALHOST` foi removido integralmente.
- `Unit Tests` continua sendo o requisito para o build e deploy de Preview.
- `Run E2E Tests` continua dependendo do Preview concluído.
- `Build & Deploy Production` continua dependendo do sucesso do Preview e dos testes E2E.
- Os relatórios HTML, JSON, artifact e TestDino permanecem no job `e2e-tests`.

### Fluxo resultante

`Unit Tests → Build & Deploy Vercel Preview → Run E2E Tests → Build & Deploy Production`

---

## ✅ Registro de Execução — Etapa 11

**Data da execução:** 20/07/2026
**Commit validado:** `1457ef6fd1e5083dbd9c05312aa93bb0945b45e9`.
**Mensagem:** `simplifica pipeline e usa builds remotos`.

### Preview Deployment

- URL: `https://automiz-ai-velo-cvhdlf9o1-fernando-ml.vercel.app`.
- Deployment ID: `dpl_Dcey5Npjxn1EBmYK9xvFqB8h5NDW`.
- Target: `preview`.
- Status final: `Ready`.
- Resposta HTTP: `200`.
- O bundle contém o project ref de Preview `lxpvdsvxpfbetcogaeba`.
- O bundle não contém o project ref de Production `zfxbozdbybolusncsewp`.

### Barreira dos testes E2E

- O deployment de Production não iniciou enquanto o job E2E estava em execução.
- O job de Production depende de `build-and-deploy` e `e2e-tests`.
- O início posterior do build de Production comprova que as dependências obrigatórias concluíram com sucesso.
- O job redundante `testLOCALHOST` não existe mais no pipeline.

### Production Deployment

- URL do deployment: `https://automiz-ai-velo-bd5kl7dyu-fernando-ml.vercel.app`.
- Deployment ID: `dpl_9Ws8NP9iLaGDfmuhLY49M8Qfa5fb`.
- Target: `production`.
- Status final: `Ready`.
- Domínio oficial validado: `https://velo-fml19.vercel.app`.
- Resposta HTTP do domínio oficial: `200`.
- O bundle de Production contém o project ref `zfxbozdbybolusncsewp`.
- O bundle de Production não contém o project ref de Preview `lxpvdsvxpfbetcogaeba`.

### Consulta controlada de dados

- Pedido consultado: `VLO-ZSSBE0`.
- Ocorrências no Preview: `0`.
- Ocorrências em Production: `1`.
- A validação foi somente leitura; nenhum pedido foi criado, alterado ou removido.

### Resultado da Etapa 11

- Preview e Production foram construídos remotamente em deployments separados.
- Cada bundle contém somente o project ref Supabase correspondente ao seu ambiente.
- Production iniciou somente após a conclusão das dependências e foi associada ao domínio oficial.
- Um registro controlado de Production não foi encontrado no Preview.
- A estratégia de builds remotos resolveu a incompatibilidade entre builds prebuilt locais e variáveis `Sensitive` da Vercel.

---

## 🛡️ Registro de Execução — Etapa 12

**Data da execução:** 20/07/2026
**Escopo executado:** comparação de migrações, Edge Function e RLS entre Preview e Production.

### Migrações e schema

- Preview e Production possuem as mesmas quatro versões:
  - `20251221161820`.
  - `20251221163213`.
  - `20251221205335`.
  - `20251221205414`.
- O histórico de migrações é idêntico nos dois projetos.
- As colunas e configurações da tabela `public.orders` são idênticas.
- Nenhuma migration foi aplicada durante esta validação.

### Edge Function `credit-analysis`

- Preview: status `ACTIVE`, versão `1`, `verify_jwt=false`.
- Production: status `ACTIVE`, versão `4`, `verify_jwt=false`.
- O hash do código implantado é idêntico nos dois ambientes: `320d2c1a4ed03e1d4a9a0d1ae406bb3a2d058e5fbc04b8814247fd34a79176d5`.
- A diferença de versão é apenas histórica; o conteúdo efetivamente implantado é igual.
- Preview sem credenciais: HTTP `200`, resposta válida.
- Preview com publishable key: HTTP `200`, resposta válida.
- Production sem credenciais: HTTP `200`, resposta válida.
- Production com publishable key: HTTP `200`, resposta válida.
- O comportamento público é coerente com `verify_jwt=false`.

### RLS

- RLS está habilitado em `public.orders` nos dois ambientes.
- Policies idênticas:
  - `Anyone can create orders` para `INSERT`.
  - `Anyone can view orders by order number` para `SELECT`.
- Testes executados como role `anon` dentro de transações revertidas:
  - Preview: `INSERT=1`, `SELECT=1`, `UPDATE=0`, `DELETE=0`.
  - Production: `INSERT=1`, `SELECT=1`, `UPDATE=0`, `DELETE=0`.
- Todos os dados sintéticos usados na auditoria foram descartados com `ROLLBACK`.
- Nenhum dado persistente foi criado, alterado ou removido.

### Ressalva de segurança identificada

- Apesar do nome “by order number”, a policy de leitura usa `USING (true)`.
- Essa expressão permite que a role anônima leia todas as linhas disponíveis na tabela, não apenas um pedido específico.
- `UPDATE` e `DELETE` anônimos estão corretamente bloqueados pela ausência de policies correspondentes.
- O acesso público irrestrito a `SELECT` e `INSERT` existe igualmente nos dois ambientes e vem das migrations; não é uma divergência entre Preview e Production.
- A alteração dessa policy não foi realizada nesta etapa porque mudaria o comportamento funcional e exige uma decisão explícita sobre o modelo de acesso.

### Decisão para o material de estudo

- Foi decidido manter intencionalmente as policies públicas de `SELECT` e `INSERT` para preservar o comportamento didático do projeto.
- Este repositório e seus ambientes são destinados exclusivamente a estudo e não devem armazenar dados pessoais, pedidos ou credenciais reais.
- Em uma aplicação real, `USING (true)` e `WITH CHECK (true)` para a role anônima não seriam considerados controles suficientes.
- Um ambiente real deveria exigir autenticação e autorização, restringir a leitura ao proprietário ou a perfis autorizados e validar rigorosamente quais campos podem ser inseridos.
- Dados pessoais como nome, e-mail, telefone e CPF não deveriam ficar disponíveis para consulta anônima.
- A decisão é uma exceção didática consciente, não uma recomendação de arquitetura ou segurança para Production real.

### Resultado da Etapa 12

- Migrações, schema, RLS e código da Edge Function estão sincronizados.
- A diferença de versão numérica da Function não representa diferença de código.
- As respostas autenticada e não autenticada da Function correspondem à configuração atual.
- O bloqueio anônimo de `UPDATE` e `DELETE` foi comprovado nos dois projetos.
- O acesso anônimo a `SELECT` e `INSERT` foi aceito exclusivamente como uma simplificação intencional deste material de estudo.

---

## 🔄 Registro de Execução — Etapa 13

**Data da execução:** 20/07/2026
**Commit validado:** `1457ef6fd1e5083dbd9c05312aa93bb0945b45e9`.

### Fluxo validado

1. `Unit Tests` concluiu antes do job de Preview, pois `build-and-deploy` possui dependência explícita em `unit-tests`.
2. O build remoto de Preview concluiu em estado `Ready`.
3. `Run E2E Tests` recebeu a URL dinâmica do Preview e utilizou `SUPABASE_PREVIEW_DATABASE_URL`.
4. O artifact `playwright-report-preview` permaneceu como etapa obrigatória do job E2E.
5. O reporter TestDino permaneceu habilitado na mesma execução do Playwright através de `TD_TOKEN`.
6. O build remoto de Production iniciou somente depois da conclusão do job E2E.
7. O deployment de Production concluiu em estado `Ready` e foi associado ao domínio oficial.

### Evidências dos deployments

- Preview: `https://automiz-ai-velo-cvhdlf9o1-fernando-ml.vercel.app`.
- Preview contém somente o project ref `lxpvdsvxpfbetcogaeba`.
- Production: `https://automiz-ai-velo-bd5kl7dyu-fernando-ml.vercel.app`.
- Domínio oficial: `https://velo-fml19.vercel.app`.
- Production contém somente o project ref `zfxbozdbybolusncsewp`.
- Os dois deployments responderam HTTP `200`.

### Validação dos gates de falha

- No run `29769146819`, o build de Preview falhou antes da correção dos builds remotos.
- Nesse run com falha, `Run E2E Tests` e `Build & Deploy Production` foram corretamente ignorados.
- No run do commit `1457ef6`, Production somente iniciou após Preview e E2E concluírem.
- Isso comprova que um erro em etapa obrigatória impede o deployment de Production.

### TestDino e artifact

- A execução `yarn playwright test` inclui o reporter TestDino configurado para `https://reporter.testdino.com`.
- O upload de `playwright-report/` permanece no mesmo job, após a regressão.
- Como Production depende do sucesso integral de `e2e-tests`, o job somente pôde avançar após as etapas obrigatórias retornarem sucesso.
- TestDino Test Run: `#5`.
- Origem: `GitHub Actions`.
- Commit associado: `1457ef6` — `simplifica pipeline e usa builds remotos`.
- Branch: `main`.
- Duração registrada: `1m 20s`.
- Resultado: `29` testes aprovados, `0` falhas e nenhum resultado pendente ou ignorado.
- Status exibido pelo TestDino: `All Good`.

### Resultado da Etapa 13

- O pipeline completo executou na ordem esperada e publicou builds separados de Preview e Production.
- O isolamento dos bundles e bancos foi mantido durante o fluxo.
- O gate de falha impediu corretamente Production em uma execução malsucedida.
- A publicação no TestDino foi confirmada visualmente e corresponde ao mesmo commit validado no pipeline.
- A Etapa 13 está concluída sem pendências.

---

## 🔐 Registro de Execução — Etapa 14

**Data da execução:** 20/07/2026
**Escopo executado:** revisão de segurança, arquivos ignorados, histórico e estado de versionamento.

### Arquivos ignorados

- `.env` e variações continuam ignorados.
- `.vercel/` continua ignorado.
- Relatórios e resultados do Playwright continuam ignorados.
- `/supabase/.temp/` foi adicionado ao `.gitignore` por ser estado interno gerado pela Supabase CLI.
- Os nove arquivos anteriormente rastreados em `supabase/.temp/` foram removidos somente do índice Git.
- Os arquivos `.temp` foram preservados no disco para o funcionamento local da CLI.

### Documentação da entrega

- `docs/desafio-final.md` deixou de ser ignorado.
- A regra mantém os demais arquivos de `docs/` ignorados e libera somente o documento desta entrega.
- O documento poderá ser incluído no commit final sem liberar outros conteúdos locais da pasta.

### Auditoria do conteúdo atual

- O conjunto rastreado e candidato ao commit foi analisado sem impressão de valores.
- Não foram encontrados tokens TestDino, GitHub, Vercel, Supabase secret/service-role, JWTs ou strings reais de conexão PostgreSQL.
- Foram encontrados somente dois exemplos de conexão com placeholders:
  - `.env.example`.
  - `README.md`.
- Nenhum secret foi adicionado pelo workflow ou pela documentação produzida.

### Auditoria do histórico

- `.env` esteve versionado em três commits antigos.
- Dois snapshots continham somente uma Supabase publishable key, URL e project ref.
- Nenhum snapshot histórico continha `DATABASE_URL`, Supabase secret/service-role, token TestDino, token GitHub ou outro padrão elevado identificado.
- Publishable keys são destinadas ao cliente e possuem baixo privilégio; a proteção efetiva continua dependendo de RLS.
- O histórico também continha `supabase/.temp/pooler-url`, sem senha de banco, que deixa de ser rastreado a partir desta correção.

### Credencial que exige rotação

- Tokens TestDino foram exibidos anteriormente na conversa e em capturas de tela.
- Mesmo não estando presentes no Git, devem ser considerados expostos.
- Foi gerada uma nova chave no TestDino, as anteriores foram revogadas e foram atualizados:
  - o GitHub Secret `TD_TOKEN`;
  - a variável local `TESTDINO_TOKEN` no `.env`.
- O novo valor não deve ser enviado na conversa, documentação, logs ou commits.
- A rotação foi confirmada pelo responsável pelo projeto em 20/07/2026.

### Estado da Etapa 14

- A higiene do repositório e as regras de ignore foram corrigidas.
- Os arquivos gerados pela Supabase CLI não serão mais versionados.
- A documentação final está pronta para ser incluída no versionamento.
- O token TestDino exposto foi rotacionado e a Etapa 14 está concluída.

---

## 📦 Preparação da Entrega — Etapa 15

**Data da preparação:** 20/07/2026

### Estratégia entregue

- Supabase Preview e Production utilizam projetos fisicamente separados.
- A Vercel mantém conjuntos próprios de variáveis `VITE_SUPABASE_*` para Preview e Production.
- Preview e Production são compilados remotamente em builds independentes, permitindo o uso seguro das variáveis `Sensitive` da Vercel.
- O bundle de Preview nunca é promovido diretamente para Production.
- Os testes E2E utilizam somente o banco de Preview e executam contra a URL dinâmica do Preview Deployment.
- Production é publicada somente após Unit Tests, Preview Deployment e E2E concluírem com sucesso.

### Checklist dos critérios de aceitação

- [x] Existem dois projetos Supabase distintos.
- [x] Preview usa `lxpvdsvxpfbetcogaeba`.
- [x] Production usa `zfxbozdbybolusncsewp`.
- [x] Pedido criado pelo E2E não apareceu em Production.
- [x] Bundle de Preview não contém o project ref de Production.
- [x] Bundle de Production não contém o project ref de Preview.
- [x] O domínio oficial de Production utiliza o bundle de Production.
- [x] As quatro migrations estão sincronizadas.
- [x] A Edge Function `credit-analysis` possui código idêntico nos dois ambientes.
- [x] RLS e policies são idênticos nos dois ambientes.
- [x] A exceção didática das policies públicas está documentada.
- [x] O pipeline executou 29 testes E2E com sucesso.
- [x] O resultado foi publicado no TestDino como Test Run `#5`.
- [x] O relatório Playwright foi mantido como artifact do pipeline.
- [x] O gate de falha impede Production quando uma dependência falha.
- [x] Arquivos `.env`, `.vercel/`, relatórios e `supabase/.temp/` estão ignorados.
- [x] Nenhum secret foi encontrado no conteúdo candidato à entrega.
- [x] Token TestDino exposto foi rotacionado e revogado.
- [x] Regressão final executada após a rotação.

### Evidências principais

- Commit do pipeline validado: `1457ef6fd1e5083dbd9c05312aa93bb0945b45e9`.
- Preview validado: `https://automiz-ai-velo-cvhdlf9o1-fernando-ml.vercel.app`.
- Production validada: `https://automiz-ai-velo-bd5kl7dyu-fernando-ml.vercel.app`.
- Domínio oficial: `https://velo-fml19.vercel.app`.
- TestDino: Test Run `#5`, 29 aprovados, 0 falhas, duração de `1m 20s`.
- Run de falha usado para validar o gate: `29769146819`.

### Procedimento de rollback

#### Aplicação na Vercel

1. Confirmar que o problema pertence ao deployment atual de Production.
2. No plano Hobby, restaurar o deployment de Production imediatamente anterior pelo painel da Vercel ou executar `yarn vercel rollback` em um terminal autenticado.
3. Acompanhar com `yarn vercel rollback status`.
4. Validar `https://velo-fml19.vercel.app` e confirmar o project ref Supabase presente no bundle restaurado.
5. Corrigir a causa em um novo commit e passar novamente por Preview e E2E antes de publicar Production.

#### Código e workflow

1. Não usar `git reset --hard` na branch compartilhada.
2. Criar um commit reverso com `git revert <commit-com-problema>`.
3. Enviar o revert para `main`, permitindo que o pipeline valide novamente todas as etapas.
4. Se o problema estiver somente nas variáveis da Vercel, corrigir o ambiente correspondente e gerar um deployment novo, sem alterar secrets no código.

#### Supabase

1. O workflow não aplica migrations nem faz deploy de Functions automaticamente; rollback da aplicação não altera o banco.
2. Não editar nem apagar migrations já aplicadas.
3. Para corrigir schema em um cenário futuro, criar uma migration corretiva e validá-la primeiro no projeto Preview.
4. Confirmar explicitamente o project ref antes de qualquer `db push` ou `functions deploy`.

### Escopo preparado para o commit final

- Atualização de `.gitignore`.
- Remoção de `supabase/.temp/*` somente do versionamento.
- Inclusão de `docs/desafio-final.md` com plano, decisões, evidências e rollback.
- Nenhuma credencial, arquivo `.env`, artifact ou estado local da Vercel será incluído.

### Pendências antes da entrega

1. Revisar e criar o commit final somente com o escopo descrito acima.

---

## 🧪 Regressão Final após Rotação de Credencial

**Data da execução:** 20/07/2026
**Comando:** suíte Playwright completa com `--workers=1`.
**Ambiente:** aplicação e banco local configurados para Preview `lxpvdsvxpfbetcogaeba`.

### Resultado dos testes

- Resultado: `29 passed` de `29`.
- Duração reportada pelo Playwright: `1.1m`.
- Exit code: `0`.
- TestDino status: `PASSED`.
- TestDino Run ID: `d5081d0f-216c-4703-a8f3-6795be523ee2`.
- Commit associado pelo TestDino: `1457ef6`.
- Eventos `run:begin` e `run:end` entregues com sucesso.

### Relatórios

- JSON: `playwright-report/report.json`, `50.817` bytes.
- HTML: `playwright-report/index.html`, `565.018` bytes.
- Arquivos atualizados em 20/07/2026 às 16:41:45.

### Isolamento de Production

- Production possuía `18` pedidos antes e depois da regressão.
- Hash de controle anterior: `454a3621b7dd333ee4a2bd2ee1b1ae5afadb71c68c01137b5dbcd491577f08cc`.
- Hash de controle posterior: `454a3621b7dd333ee4a2bd2ee1b1ae5afadb71c68c01137b5dbcd491577f08cc`.
- Production permaneceu integralmente inalterada.

### Preservação dos pedidos de Production

Não são criados pedidos de teste em Production.

O fluxo atual funciona assim:

- Os testes E2E usam exclusivamente o banco Preview.
- Os pedidos sintéticos são criados e removidos somente no Preview.
- Depois dos testes, o pipeline apenas publica um novo front-end em Production.
- O deployment de Production não cria nem apaga registros do banco.
- Pedidos que já existiam em Production permanecem intactos.

Na regressão final, comprovamos:

- Production antes: `18` pedidos.
- Production depois: `18` pedidos.
- Hash antes e depois: idêntico.
- Preview: os `17` pedidos sintéticos foram removidos.

Portanto, os dados existentes em Production foram integralmente preservados.

### Limpeza do Preview

- A regressão criou ou recriou `17` pedidos sintéticos após o marcador de execução.
- `9` registros foram identificados pelos e-mails literais presentes na suíte.
- `8` registros CT03 foram identificados pelo padrão dinâmico documentado no teste.
- Os `17` registros foram removidos somente do Preview.
- Nenhum registro criado após o marcador permaneceu no Preview.
- Contagem final do Preview após limpeza: `0`.

### Avisos não bloqueantes

- Três uploads opcionais de trace para o TestDino excederam o timeout após a conclusão dos testes.
- Foi registrado um `ECONNRESET` do Kafka após o resumo final.
- Os avisos ocorreram depois de `run:end`, não alteraram o status `PASSED` nem o exit code `0`.

### Resultado final

- A credencial rotacionada autenticou com sucesso no TestDino.
- A regressão completa passou.
- Os relatórios HTML e JSON foram gerados.
- Production permaneceu inalterada.
- Os dados sintéticos foram removidos do Preview.
- O projeto está pronto para a revisão e o commit final da entrega.
