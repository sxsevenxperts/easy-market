# Deployment - Easy Market Dashboard no EasyPanel

## 🚀 Opção 1: Deploy Automático via GitHub (Recomendado)

Se o EasyPanel já está integrado com seu GitHub:

### Passo 1: Atualize a imagem no EasyPanel
1. Acesse seu painel EasyPanel
2. Vá para **Applications** > **easy-market-dashboard** (ou crie nova app)
3. Na aba **Docker**, defina:
   - **Repository**: `sxsevenxperts/easy-market`
   - **Branch**: `main`
   - **Dockerfile Path**: `dashboard/Dockerfile`
   - **Build Args**: 
     ```
     NEXT_PUBLIC_API_URL=https://diversos-smartmarket.yuhqmc.easypanel.host/api
     ```

### Passo 2: Configure as portas
- **Container Port**: `3001`
- **Public Port**: `80` (ou `443` para HTTPS)

### Passo 3: Configure o domínio
1. Vá para **Domains**
2. Adicione: `diversos-smartmarket.yuhqmc.easypanel.host`
3. Habilite HTTPS com Let's Encrypt
4. Aponte para o serviço `dashboard`

### Passo 4: Ambiente
Nas variáveis de ambiente, adicione:
```
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://diversos-smartmarket.yuhqmc.easypanel.host/api
```

### Passo 5: Deploy
Clique em **Deploy** e aguarde 2-5 minutos

---

## 🐋 Opção 2: Deploy Manual via Docker (Alternativa)

Se preferir fazer build localmente:

### Passo 1: Build da imagem
```bash
cd /Users/sergioponte/easy-market
docker build -f dashboard/Dockerfile -t easy-market-dashboard:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://diversos-smartmarket.yuhqmc.easypanel.host/api \
  dashboard/
```

### Passo 2: Push para registry (se usar privado)
```bash
docker tag easy-market-dashboard:latest seu-registry.com/easy-market-dashboard:latest
docker push seu-registry.com/easy-market-dashboard:latest
```

### Passo 3: No EasyPanel
1. Criar nova aplicação
2. Escolher **Docker Image**
3. Usar a imagem que fez push
4. Configurar portas e domínio (mesmo que Opção 1)

---

## ✅ Verificação

Após deploy:

1. **Acesse a dashboard**:
   ```
   https://diversos-smartmarket.yuhqmc.easypanel.host/
   ```

2. **Verifique os menu items**:
   - ✅ Dashboard
   - ✅ Alertas de Perdas (/perdas)
   - ✅ Inteligência de Vendas (/inteligencia-vendas)
   - ✅ Análise Fiscal (/analise-fiscal)
   - ✅ Gôndolas Inteligentes

3. **Monitore os logs**:
   - EasyPanel > Applications > easy-market-dashboard > Logs
   - Procure por: `ready - started server on`

---

## 🔄 Auto-Deploy com GitHub (CI/CD)

Para ativar deploy automático:

### No EasyPanel:
1. Vá para **Applications** > **easy-market-dashboard** > **Git Integration**
2. Conecte seu repositório GitHub
3. Configure a branch `main` para auto-deploy
4. Crie um webhook do GitHub para notificar EasyPanel

### No GitHub:
1. Vá para **Settings** > **Webhooks**
2. Clique em **Add Webhook**
3. URL: `https://seu-easypanel.com/webhooks/github` (pergunte ao suporte EasyPanel)
4. Events: `push`
5. Ao fazer `git push` para `main`, o deploy acontece automaticamente

---

## 🔧 Troubleshooting

### Build falha com "Module not found"
- Verifique se `npm install` foi rodado
- Confirm `dashboard/package.json` existe
- Check Node.js version (requer 16+)

### Dashboard não carrega após deploy
1. Verifique logs: `docker logs easy-market-dashboard`
2. Confirm porta 3001 está aberta
3. Verifique NEXT_PUBLIC_API_URL no painel

### Conexão com backend falha
- Verifique se backend está rodando
- Confirm NEXT_PUBLIC_API_URL aponta para endereço correto
- Check CORS no backend (`/api/*`)

---

## 📋 Features Implementadas

- ✅ **Alertas de Perdas**: Timeline de urgência (crítico, alto, médio) com ações (markdown, bundle, doação)
- ✅ **Inteligência de Vendas**: KPIs, charts 7 dias, tabela de oportunidades com recomendações
- ✅ **Análise Fiscal**: 4 cenários de redução com impacto tributário (Lei 15.224/25)
- ✅ **Gôndolas Inteligentes**: Otimização visual com sugestões de IA
- ✅ **Navbar unificada**: Menu integrado com todos os items

---

## 📞 Suporte

Para dúvidas sobre EasyPanel:
- Dashboard: https://easypanel.io
- Documentação: https://docs.easypanel.io
- Suporte: support@easypanel.io
