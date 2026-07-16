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

## Stack Tecnológica

| Categoria         | Tecnologias                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| **Frontend**      | React 18.3.1, TypeScript 5.8.3, Vite 5.4.19, Tailwind CSS 3.4.17, shadcn/ui |
| **Estado**        | Zustand (global), React Hook Form (formulários)                             |
| **Validação**     | Zod                                                                         |
| **Data Fetching** | TanStack Query                                                              |
| **Backend**       | Supabase (PostgreSQL + Edge Functions)                                      |
| **Testes E2E**    | Playwright 1.61.1 + Chromium                                                |

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
```

> Encontre essas informações em: **Project Settings → API**

> Nunca versione o `.env`. Esse arquivo já está ignorado pelo Git e contém credenciais sensíveis.

### 3. Deploy (banco + functions)

```bash
# Instalar CLI
yarn add supabase -D

# Login e vincular projeto
yarn supabase login
yarn supabase link --project-ref zfxbozdbybolusncsewp


# Aplicar migrações (cria tabelas e RLS)
yarn supabase db push

# Deploy das Edge Functions
yarn supabase functions deploy
```

Pronto! O banco e as functions estarão configurados.

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
VITE_SUPABASE_URL="https://seu_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anon_publica"
```

Configure essas variáveis pelo menos para o ambiente **Production**. Se os Preview Deployments também precisarem acessar o Supabase, habilite-as para **Preview**. O `vite.config.ts` interrompe o build caso alguma variável obrigatória esteja ausente ou a URL do Supabase seja inválida.

Como a aplicação usa `BrowserRouter`, o arquivo `vercel.json` na raiz redireciona as rotas da SPA para o `index.html`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Esse rewrite permite abrir ou atualizar diretamente páginas como `/configure`, `/order` e `/lookup` sem receber `404 NOT_FOUND` do Vercel. Arquivos estáticos gerados pelo Vite continuam sendo servidos a partir de `dist/assets`.

Antes de publicar, valide o build localmente:

```bash
yarn build
yarn preview
```

Após salvar as configurações no Vercel, execute um novo deploy. A variável `BASE_URL` é usada pelo Playwright e não é necessária para o build do frontend; configure-a no ambiente de testes com a URL publicada caso a suíte E2E deva validar a produção.

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

# Reproduzir localmente a regressão usada no CI
yarn playwright test --workers=1 --retries=2 --reporter=line,html

# Executar um arquivo específico
npx playwright test playwright/e2e/checkout.spec.ts --project=chromium

# Executar com o navegador visível
npx playwright test --project=chromium --headed

# Executar o primeiro de dois shards, dividindo a suíte para execução paralela
yarn playwright test --shard=1/2

# Abrir o último relatório HTML
npx playwright show-report

# Validar a tipagem dos testes
npx tsc -p tsconfig.playwright.json --noEmit
```

Os cenários que criam pedidos reais precisam de acesso ao Supabase e de uma `DATABASE_URL` válida. Para reduzir concorrência sobre o banco durante a execução local desses cenários, use `--workers=1` quando necessário.

A opção `--shard=1/2` divide a suíte em duas partes e executa somente o primeiro shard. Ela é útil para distribuir os testes entre dois processos ou jobs de CI e reduzir o tempo total da execução. Para executar a outra parte da suíte, utilize `yarn playwright test --shard=2/2`; os dois comandos são necessários para cobrir todos os testes.

### Integração contínua com GitHub Actions

O workflow `.github/workflows/playwright.yml` executa a suíte completa em pushes e pull requests direcionados às branches `main` e `master`. A execução utiliza Ubuntu, Node.js LTS, Chromium, um worker e até duas novas tentativas para testes que falharem no CI.

O repositório precisa ter os seguintes **Repository secrets** configurados em **Settings → Secrets and variables → Actions**:

| Secret                          | Finalidade                                                            |
| ------------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`                  | Conexão PostgreSQL usada pela preparação e limpeza dos dados de teste |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase utilizada pela aplicação Vite                 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública utilizada pelo cliente Supabase no navegador            |

Os valores devem corresponder ao `.env` local, mas o arquivo e as credenciais nunca devem ser adicionados ao Git.

O workflow utiliza as versões atuais das Actions baseadas em Node.js 24:

- `actions/checkout@v7`
- `actions/setup-node@v7`
- `actions/upload-artifact@v7`

Durante a execução, os reporters `line` e `html` são habilitados. O primeiro exibe o andamento no log do job e o segundo gera `playwright-report/index.html`. Ao final, a pasta `playwright-report/` é publicada como artifact por 30 dias. A variável `PLAYWRIGHT_HTML_OPEN=never` impede que o relatório tente abrir um servidor interativo no runner.

Se o relatório não for gerado, o passo de upload falhará por causa de `if-no-files-found: error`, evitando que a ausência do artifact passe apenas como warning.
