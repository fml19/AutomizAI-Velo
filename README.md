# Velô Sprint - Configurador de Veículo Elétrico

Aplicação web em React para configuração e compra do veículo elétrico **Velô Sprint**.

## Sobre o Projeto

Uma SPA (Single Page Application) que permite:

- Personalizar cores, rodas e opcionais do veículo
- Calcular preços em tempo real
- Realizar pedidos com análise de crédito
- Consultar status de pedidos

**Especificações do Velô Sprint:** 450 km de autonomia | 0-100 km/h em 3.2s | 500 cv

---

## Atualizações de 20/07/2026

- Separação completa entre os ambientes **Preview** e **Production**, cada um com seu próprio projeto Supabase.
- Pipeline de entrega contínua reorganizado para executar testes unitários, publicar o Preview, rodar a regressão E2E no Preview e somente então publicar em Production.
- Builds do Vercel executados remotamente, consumindo as variáveis `Sensitive` configuradas diretamente em cada ambiente.
- Integração do Playwright com o TestDino pelo endpoint `https://reporter.testdino.com`.
- Relatórios HTML e JSON gerados dentro de `playwright-report/` e publicados como artifact do GitHub Actions.
- Arquivos temporários da Supabase CLI removidos do versionamento e mantidos apenas no ambiente local.
- Evidências e decisões da implementação registradas em [`docs/desafio-final.md`](docs/desafio-final.md).

### Isolamento dos dados

| Ambiente | Frontend | Banco | Uso |
| -------- | -------- | ----- | --- |
| **Preview** | Vercel Preview Deployment | Supabase Preview | Validação e testes E2E |
| **Production** | Vercel Production Deployment | Supabase Production | Aplicação publicada e dados reais |

Os testes E2E usam exclusivamente o banco Preview. Os pedidos sintéticos são criados e removidos somente nesse ambiente; a publicação do frontend em Production não cria nem apaga registros do banco de produção.

Na regressão final, Production permaneceu com os mesmos 18 pedidos e com hash idêntico antes e depois da execução. No Preview, os 17 pedidos sintéticos criados pela suíte foram removidos ao final.

> **Atenção — material de estudo:** as políticas RLS atuais permitem `SELECT` e `INSERT` para o papel `anon` intencionalmente, para viabilizar o exercício. Essa configuração não deve ser usada em um sistema real ou com dados reais. Em um projeto de produção, o acesso deve exigir autenticação e políticas de autorização adequadas.

---

## Stack Tecnológica

| Categoria         | Tecnologias                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| **Frontend**      | React 18.3.1, TypeScript 5.8.3, Vite 5.4.19, Tailwind CSS 3.4.17, shadcn/ui |
| **Estado**        | Zustand (global), React Hook Form (formulários)                             |
| **Validação**     | Zod                                                                         |
| **Data Fetching** | TanStack Query                                                              |
| **Backend**       | Supabase (PostgreSQL + Edge Functions)                                      |
| **Testes E2E**    | Playwright 1.61.1 + Chromium + TestDino                                     |
| **Entrega**       | GitHub Actions + Vercel                                                     |

---

## Pré-requisitos e versões

As versões abaixo correspondem ao ambiente atualmente utilizado para desenvolver e executar o projeto:

| Ferramenta       | Versão validada | Obrigatória?                 | Finalidade                                     |
| ---------------- | --------------- | ---------------------------- | ---------------------------------------------- |
| **Node.js**      | 24.17.0         | Sim                          | Executar Vite, TypeScript e os testes          |
| **npm**          | 11.13.0         | Uma opção                    | Instalar pacotes e executar scripts            |
| **Yarn Classic** | 1.22.22         | Uma opção                    | Gerenciador associado ao `yarn.lock`           |
| **Git**          | 2.51.1          | Recomendado                  | Clonar e versionar o projeto                   |
| **Playwright**   | 1.61.1          | Sim para E2E                 | Automação dos testes no Chromium               |
| **TypeScript**   | 5.8.3           | Sim                          | Compilação e validação dos arquivos TypeScript |
| **Supabase CLI** | 2.107.0         | Somente para banco/functions | Migrações e deploy das Edge Functions          |
| **VS Code**      | 1.128.0         | Opcional                     | Editor utilizado no projeto                    |

Não é necessário instalar PostgreSQL localmente quando `DATABASE_URL` aponta para o banco remoto do Supabase. As demais bibliotecas e suas versões são instaladas a partir de `package.json` e `yarn.lock`.

### Extensões recomendadas do VS Code

O arquivo `.vscode/extensions.json` recomenda estas extensões:

| Extensão                        | ID                         | Versão validada | Finalidade                                |
| ------------------------------- | -------------------------- | --------------- | ----------------------------------------- |
| **Playwright Test for VS Code** | `ms-playwright.playwright` | 1.1.19          | Executar e depurar testes E2E pelo editor |
| **Prettier - Code formatter**   | `esbenp.prettier-vscode`   | 12.4.0          | Formatação de código                      |

Instalação pelo terminal do VS Code:

```bash
code --install-extension ms-playwright.playwright
code --install-extension esbenp.prettier-vscode
```

As extensões são opcionais para a execução via terminal e podem receber atualizações compatíveis no Marketplace.

---

## Instalação

```bash
# Instalar dependências usando o lockfile do projeto
yarn install

# Instalar o navegador usado pelos testes E2E
npx playwright install chromium

# Rodar em desenvolvimento
yarn dev
```

Alternativamente, é possível usar `npm install` e `npm run dev`. Para reproduzir exatamente as versões registradas no repositório, prefira Yarn e preserve o `yarn.lock`.

Acesse: `http://localhost:5173`

---

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome e senha para o banco
4. Aguarde a criação (~2 minutos)

### 2. Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anon_publica"
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"

# Necessária para os testes que consultam, inserem ou removem pedidos diretamente
DATABASE_URL="postgresql://usuario:senha@host:porta/banco"

# Opcional; o padrão é http://localhost:5173/
BASE_URL="http://localhost:5173/"

# Necessária para publicar os resultados no TestDino
TESTDINO_TOKEN="seu_token_testdino"
```

> Encontre essas informações em: **Project Settings → API**

> Nunca versione o `.env`. Esse arquivo já está ignorado pelo Git e contém credenciais sensíveis.

### 3. Deploy (banco + functions)

```bash
# Instalar CLI
yarn add supabase -D

# Login e conferência dos projetos disponíveis
yarn supabase login
yarn supabase projects list

# Vincular somente o projeto Preview durante o desenvolvimento e os testes
yarn supabase link --project-ref <preview-project-ref>

# Conferir o vínculo e simular as migrações antes de aplicá-las
yarn supabase migration list --linked
yarn supabase db push --linked --dry-run

# Aplicar as migrações e publicar a função somente no Preview
yarn supabase db push --linked
yarn supabase functions deploy credit-analysis --project-ref <preview-project-ref>
```

Substitua `<preview-project-ref>` pelo ID do projeto Supabase reservado ao Preview. Antes de qualquer `link`, `db push` ou `functions deploy`, confirme o project ref exibido pela CLI. Não execute esses comandos contra Production sem uma decisão explícita e uma janela de mudança apropriada.

### 4. Deploy do frontend no Vercel (Vite)

O frontend pode ser publicado no Vercel diretamente a partir deste repositório. Ao importar o projeto, utilize estas configurações:

| Configuração     | Valor                            |
| ---------------- | -------------------------------- |
| Framework Preset | `Vite`                           |
| Build Command    | `yarn build`                     |
| Output Directory | `dist`                           |
| Install Command  | `yarn install --frozen-lockfile` |

Cadastre no projeto do Vercel, em **Settings → Environment Variables**, as variáveis usadas no build:

```env
VITE_SUPABASE_PROJECT_ID="seu_project_id"
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anon_publica"
```

Cadastre as três variáveis separadamente para **Preview** e **Production**. Os valores de Preview devem apontar apenas para o Supabase Preview, enquanto os valores de Production devem apontar apenas para o Supabase Production. O `vite.config.ts` interrompe o build caso uma variável obrigatória esteja ausente ou a URL do Supabase seja inválida.

Como as variáveis estão marcadas como `Sensitive` no Vercel, o pipeline utiliza builds remotos. Não reutilize um bundle gerado para Preview em Production e não use `vercel build --prebuilt` nesse fluxo.

Como a aplicação usa `BrowserRouter`, o arquivo `vercel.json` na raiz redireciona as rotas da SPA para o `index.html` e controla o deploy automático integrado ao Git:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```

As linhas têm estas finalidades:

- `rewrites`: permite abrir ou atualizar diretamente páginas como `/configure`, `/order` e `/lookup` sem receber `404 NOT_FOUND` do Vercel.
- `destination: "/index.html"`: entrega o ponto de entrada do Vite para que o `BrowserRouter` resolva a rota no navegador.
- `git.deploymentEnabled.main: false`: desabilita o deploy automático causado por pushes na branch `main`.

Essa configuração não desabilita deploys manuais e não bloqueia automaticamente outras branches. Como branches não listadas mantêm o comportamento padrão da Vercel, elas ainda podem gerar Preview Deployments quando o repositório está conectado ao Git. Para desativar o deploy automático de todas as branches, o valor de `deploymentEnabled` teria que ser `false` em vez de um objeto por branch.

### Deploy manual com a Vercel CLI

A Vercel CLI está instalada como dependência de desenvolvimento. Execute os comandos abaixo na raiz do projeto:

```bash
# Autentica o terminal na conta da Vercel.
yarn vercel login

# Vincula a pasta local a um projeto existente ou cria a associação inicial.
yarn vercel link

# Baixa configurações e variáveis do ambiente Preview para o cache local.
yarn vercel pull --environment=preview

# Cria remotamente um Preview Deployment com as variáveis de Preview.
yarn vercel deploy --target=preview

# Cria remotamente um novo bundle com as variáveis de Production.
yarn vercel deploy --prod
```

O comando `pull` só é necessário para reproduzir localmente as configurações da Vercel com comandos como `vercel build` ou `vercel dev`. Sempre execute primeiro um Preview Deployment, valide a URL gerada e use `--prod` somente quando a versão estiver aprovada.

Consulte também a documentação oficial de [configuração Git](https://vercel.com/docs/project-configuration/git-configuration) e de [deploy pela CLI](https://vercel.com/docs/cli/deploy).

Ao executar `vercel link` ou `vercel pull`, a CLI cria a pasta `.vercel/`, que contém a associação do projeto e cópias locais de configurações e variáveis. As entradas `.vercel` e `.env*` no `.gitignore` impedem o versionamento desses dados locais e de possíveis credenciais.

Antes de publicar, valide o build localmente:

```bash
yarn build
yarn preview
```

### Validar o Preview Deployment com Playwright

Antes de promover uma versão para produção, execute os testes E2E contra a URL do Preview Deployment. A variável de ambiente `BASE_URL`, definida em tempo de execução, substitui a URL padrão de `playwright.config.ts` e faz o Playwright navegar pela aplicação publicada no Preview.

Substitua `<preview-deployment-url>` pela URL retornada no deploy:

```bash
# PowerShell — executa todos os testes E2E no Chromium contra o Preview
$env:BASE_URL="<preview-deployment-url>"
yarn playwright test --project=chromium

# Bash, Linux ou macOS — executa todos os testes E2E no Chromium contra o Preview
BASE_URL="<preview-deployment-url>" yarn playwright test --project=chromium
```

> **Observação:** no PowerShell, use obrigatoriamente `$env:BASE_URL="..."`. A forma `BASE_URL="..." yarn playwright test` funciona somente em Bash. Como nenhum arquivo de teste específico é informado, o comando executa toda a suíte E2E configurada para o projeto Chromium.

> **Voltar a testar localmente:** depois de executar os testes contra o Preview, abra um novo terminal, diferente daquele em que `BASE_URL` foi definida, e execute `yarn playwright test --project=chromium`. O novo terminal usará o endereço local padrão `http://localhost:5173/`. Para reutilizar o mesmo terminal, execute antes `Remove-Item Env:BASE_URL` no PowerShell.

Substitua a URL do exemplo pela URL retornada em cada novo Preview Deployment. Essa execução permite validar os fluxos reais da versão hospedada antes de usar `yarn vercel deploy --prod`, reduzindo o risco de publicar uma regressão em produção. A variável é usada somente durante os testes e não altera o build nem a configuração permanente da aplicação.

Sem `BASE_URL`, o `playwright.config.ts` inicia o Vite e usa `http://localhost:5173/`. Para testar um deployment, informe sempre a URL explicitamente.

---

## Estrutura Principal

```
src/
├── pages/           # Páginas da aplicação
├── components/      # Componentes React
│   ├── configurator/   # Configurador do carro
│   ├── landing/        # Landing page
│   └── ui/             # Componentes shadcn/ui
├── store/           # Estado global (Zustand)
├── hooks/           # Hooks customizados
└── integrations/    # Cliente Supabase
```

---

## Rotas

| Rota         | Descrição               |
| ------------ | ----------------------- |
| `/`          | Landing page            |
| `/configure` | Configurador do veículo |
| `/order`     | Checkout/Pedido         |
| `/success`   | Confirmação do pedido   |
| `/lookup`    | Consulta de pedidos     |

---

## Modelo de Preços

- **Preço base:** R$ 40.000
- **Rodas Sport:** +R$ 2.000
- **Precision Park:** +R$ 5.500
- **Flux Capacitor:** +R$ 5.000
- **Financiamento:** 12x com juros de 2% a.m.

---

## Banco de Dados

**Tabela `orders`** — campos principais:

- `order_number` — Formato: VLO-XXXXXX
- `color`, `wheel_type`, `optionals` — Configuração
- `customer_name`, `customer_email`, `customer_cpf` — Cliente
- `payment_method`, `total_price` — Pagamento
- `status` — pending, approved, rejected, analysis

---

## Análise de Crédito

| Score   | Resultado  |
| ------- | ---------- |
| > 700   | Aprovado   |
| 501-700 | Em análise |
| ≤ 500   | Reprovado  |

_Se entrada ≥ 50% do total, aprova mesmo com score < 700_

---

## Fluxo Principal

```
Landing → Configurador → Checkout → Análise de Crédito → Confirmação
```

---

## Scripts

```bash
npm run dev        # Servidor de desenvolvimento em http://localhost:5173
npm run build      # Build de produção
npm run build:dev  # Build no modo development
npm run preview    # Servir localmente o build gerado
npm run lint       # Verificar o código com ESLint
```

### Testes E2E

O Playwright inicia o servidor Vite automaticamente quando necessário.

```bash
# Executar todos os testes no Chromium
npx playwright test --project=chromium

# Executar via terminal
yarn playwright test

# Executar a regressão com um worker, preservando os reporters configurados
yarn playwright test --workers=1

# Executar um arquivo específico
npx playwright test playwright/e2e/checkout.spec.ts --project=chromium

# Executar com o navegador visível
npx playwright test --project=chromium --headed

# Executar o primeiro de dois shards, dividindo a suíte para execução paralela
yarn playwright test --shard=1/2

# Abrir o último relatório HTML
npx playwright show-report playwright-report

# Validar a tipagem dos testes
npx tsc -p tsconfig.playwright.json --noEmit
```

Os cenários que criam pedidos reais precisam de acesso ao Supabase e de uma `DATABASE_URL` válida. Para reduzir concorrência sobre o banco durante a execução local desses cenários, use `--workers=1` quando necessário.

A opção `--shard=1/2` divide a suíte em duas partes e executa somente o primeiro shard. Ela é útil para distribuir os testes entre dois processos ou jobs de CI e reduzir o tempo total da execução. Para executar a outra parte da suíte, utilize `yarn playwright test --shard=2/2`; os dois comandos são necessários para cobrir todos os testes.

### Integração contínua com GitHub Actions

O workflow `.github/workflows/cd.yml` é executado em pushes e pull requests direcionados às branches `main` e `master`. O fluxo atual contém quatro etapas encadeadas:

1. **Unit Tests:** executa os testes unitários com Vitest.
2. **Build & Deploy Vercel Preview:** cria remotamente um Preview Deployment com as variáveis de Preview configuradas no Vercel.
3. **Run E2E Tests:** executa a regressão Playwright contra a URL gerada, usando exclusivamente o banco Supabase Preview, e envia os resultados ao TestDino.
4. **Build & Deploy Production:** em eventos de `push`, publica exatamente o commit aprovado pelos E2E, usando um novo build remoto com as variáveis de Production.

Se qualquer etapa obrigatória falhar, as etapas dependentes não são executadas. Pull requests validam até os E2E, mas não promovem para Production.

O repositório precisa ter os seguintes **Repository secrets** configurados em **Settings → Secrets and variables → Actions**:

| Secret                          | Finalidade                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `SUPABASE_PREVIEW_DATABASE_URL` | Conexão PostgreSQL usada para preparar e limpar os dados de teste no Preview   |
| `TD_TOKEN`                      | Token usado pelo reporter Playwright para publicar os resultados no TestDino  |
| `VERCEL_TOKEN`                  | Autenticação da Vercel CLI no pipeline                                         |
| `VERCEL_PROJECT_ID`             | Identificação do projeto Vercel                                                |
| `VERCEL_ORGID`                  | Identificação da conta ou organização Vercel                                   |

As variáveis `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` são obtidas pelo build remoto diretamente dos ambientes Preview e Production do Vercel. Elas não precisam ser copiadas para o workflow. Arquivos `.env`, URLs de banco e tokens nunca devem ser adicionados ao Git.

O workflow utiliza as versões atuais das Actions baseadas em Node.js 24:

- `actions/checkout@v7`
- `actions/setup-node@v7`
- `actions/upload-artifact@v7`

O `playwright.config.ts` mantém três reporters ativos:

- TestDino, usando `TESTDINO_TOKEN` e `https://reporter.testdino.com`.
- HTML, salvo em `playwright-report/index.html`.
- JSON, salvo em `playwright-report/report.json`.

Ao final do job E2E, toda a pasta `playwright-report/` é publicada no artifact `playwright-report-preview`, inclusive quando houver falha nos testes, desde que o job não tenha sido cancelado.
