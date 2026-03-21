# Easy Market — Guia de Deploy Rápido

> Versão 3.0.0 | Última atualização: Março 2026

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

| Ferramenta | Versão mínima | Como verificar |
|-----------|---------------|----------------|
| Node.js   | 18.x          | `node -v`      |
| npm       | 9.x           | `npm -v`       |
| Docker    | 24.x          | `docker -v`    |
| Docker Compose | 2.x      | `docker compose version` |
| Git       | 2.x           | `git --version` |

Você também precisará de:
- Uma conta no **Supabase** com projeto criado
- Acesso ao servidor **EasyPanel** (ou VPS própria)
- Um domínio configurado (opcional para ambiente local)

---

## 1. Setup Local (sem Docker)

### 1.1 Clonar o repositório

```bash
git clone https://github.com/seu-usuario/easy-market.git
cd easy-market
```

### 1.2 Instalar dependências do backend

```bash
cd backend
npm install
```

### 1.3 Configurar variáveis de ambiente

Copie o arquivo de exemplo e edite com suas credenciais:

```bash
cp .env.example .env
nano .env   # ou use seu editor preferido
```

Preencha todas as variáveis obrigatórias (veja a tabela de referência abaixo).

### 1.4 Iniciar o backend

```bash
npm start
# Servidor disponível em http://localhost:3000
```

Para desenvolvimento com hot reload:

```bash
npm run dev
```

---

## 2. Setup com Docker (recomendado)

### 2.1 Configurar o .env

```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

### 2.2 Subir todos os serviços

```bash
docker compose up -d
```

Serviços disponíveis:
- **Backend API:** http://localhost:3000
- **Frontend:**    http://localhost:3001

### 2.3 Ver logs em tempo real

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### 2.4 Parar os serviços

```bash
docker compose down
```

---

## 3. Deploy no EasyPanel — Passo a Passo

### 3.1 Acessar o EasyPanel

1. Abra o navegador e acesse `https://seu-servidor:3000`
2. Faça login com suas credenciais de administrador
3. Na tela principal, você verá o dashboard com seus projetos

> **Screenshot:** Tela inicial do EasyPanel mostrando o botão "New Project" no canto superior direito.

### 3.2 Criar novo projeto

1. Clique em **"New Project"**
2. Escolha um nome: `easy-market`
3. Clique em **"Create"**

> **Screenshot:** Modal de criação de projeto com campo "Project Name" preenchido com "easy-market".

### 3.3 Adicionar o serviço de backend

1. Dentro do projeto, clique em **"Create Service"**
2. Selecione **"App"**
3. Em "Source", escolha **"Github"** (ou "Docker Image" se usar registry)
4. Configure o repositório e a branch `main`
5. Em "Build", selecione **"Dockerfile"** e informe o caminho: `Dockerfile`
6. Em "Port", adicione: `3000`

> **Screenshot:** Aba "Build" com o campo "Dockerfile Path" preenchido e botão "Deploy" visível.

### 3.4 Configurar variáveis de ambiente

1. Vá na aba **"Environment"** do serviço
2. Clique em **"Bulk Edit"**
3. Cole as variáveis do seu `.env` (apenas as necessárias para produção)
4. Clique em **"Save"**

> **Screenshot:** Editor de variáveis de ambiente no EasyPanel com múltiplas linhas `CHAVE=VALOR`.

### 3.5 Configurar domínio e SSL

1. Vá na aba **"Domains"**
2. Clique em **"Add Domain"**
3. Informe seu domínio: `api.seudominio.com.br`
4. Marque **"HTTPS"** para ativar o certificado Let's Encrypt automático
5. Clique em **"Save"**

> **Screenshot:** Aba "Domains" com o campo de domínio preenchido e toggle HTTPS ativado.

### 3.6 Fazer o primeiro deploy

1. Volte para a aba **"General"**
2. Clique em **"Deploy"**
3. Acompanhe os logs na aba **"Logs"**
4. Aguarde a mensagem: `Server running on port 3000`

> **Screenshot:** Aba "Logs" exibindo o output do build e a mensagem de sucesso do servidor.

### 3.7 Verificar saúde da aplicação

Acesse no navegador:
```
https://api.seudominio.com.br/health
```

Resposta esperada:
```json
{ "status": "ok", "uptime": 123.45 }
```

---

## 4. Referência de Variáveis de Ambiente

| Variável              | Obrigatória | Descrição                                      | Exemplo                          |
|-----------------------|:-----------:|------------------------------------------------|----------------------------------|
| `PORT`                | Sim         | Porta em que o servidor escuta                 | `3000`                           |
| `NODE_ENV`            | Sim         | Ambiente de execução                           | `production`                     |
| `SUPABASE_URL`        | Sim         | URL do projeto Supabase                        | `https://xxxx.supabase.co`       |
| `SUPABASE_SERVICE_KEY`| Sim         | Chave de serviço do Supabase (service_role)    | `eyJhbGci...`                    |
| `JWT_SECRET`          | Sim         | Segredo para assinatura de tokens JWT          | `string-aleatoria-longa`         |
| `ALLOWED_ORIGINS`     | Não         | Origens permitidas pelo CORS (separadas por `,`)| `https://app.seudominio.com.br` |
| `LOG_LEVEL`           | Não         | Nível de log da aplicação                      | `info` / `debug` / `error`       |

> **Segurança:** Nunca commite o arquivo `.env` no repositório. Ele já está listado no `.gitignore`.

---

## 5. Solução de Problemas Comuns

### Erro: `Cannot connect to Supabase`
- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` estão corretos no `.env`
- Confirme que o IP do servidor está liberado nas configurações do Supabase (Network > Allowed IPs)

### Erro: `Port 3000 already in use`
- Outro processo está usando a porta. Libere com:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

### Erro: `Docker build failed`
- Certifique-se de estar na raiz do projeto ao rodar `docker compose up`
- Verifique se o arquivo `Dockerfile` existe: `ls -la Dockerfile`

### Container reiniciando em loop no EasyPanel
- Acesse a aba **"Logs"** do serviço no EasyPanel para ver o erro
- Verifique se todas as variáveis obrigatórias foram configuradas
- Confirme que o health check `/health` está respondendo corretamente

### Frontend não carrega (tela em branco)
- Abra o DevTools do navegador (F12) e veja erros no Console
- Verifique se os arquivos estão na pasta `frontend/`
- Confirme que o container Nginx está rodando: `docker compose ps`

### Requisições à API retornam 502 Bad Gateway
- O backend pode estar demorando para iniciar. Aguarde ~20 segundos e tente novamente
- Verifique os logs do backend: `docker compose logs backend`
- Confirme que o nome do serviço `backend` no `nginx.conf` bate com o nome no `docker-compose.yml`

---

## 6. Script de Deploy Automatizado

Para fazer build e receber instruções de deploy de uma vez só:

```bash
# Dar permissão de execução
chmod +x scripts/deploy-easypanel.sh

# Executar
./scripts/deploy-easypanel.sh

# Com versão específica
./scripts/deploy-easypanel.sh --tag 3.1.0
```

---

## Suporte

Em caso de dúvidas, consulte:
- Documentação do EasyPanel: https://easypanel.io/docs
- Documentação do Supabase: https://supabase.com/docs
- Issues do projeto: https://github.com/seu-usuario/easy-market/issues
