# ⚙️ CONFIGURAÇÃO EASYMARKET NO EASYPANEL

## 🔧 Variáveis de Ambiente (Copie e Cole)

**No EasyPanel:**
1. Vá para: `easymarket` → `Configurações` → `Variáveis de Ambiente`
2. Clique em **"+ Adicionar Variável"**
3. Cole EXATAMENTE assim:

### **Obrigatórias (ALTERE ESTAS):**

```
SUPABASE_PASSWORD=AQUI_SUA_SENHA_POSTGRES
JWT_SECRET=3x7mK9pL2qR5wN8vB1jD4fG6hS0tU9cX
ANTHROPIC_API_KEY=sk-ant-api03-SUA_CHAVE_AQUI
```

### **Padrão (deixe como está):**

```
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

SUPABASE_URL=https://qfkwqfrnemqregjqxkcr.supabase.co
SUPABASE_KEY=sb_publishable_vBAVB5lBnPY18GbnJxRlkA_fxMYrUmQ
SUPABASE_HOST=qfkwqfrnemqregjqxkcr.supabase.co
SUPABASE_DB=postgres
SUPABASE_USER=postgres
SUPABASE_PORT=5432

CORS_ORIGIN=*
JWT_EXPIRES_IN=7d
```

---

## 🚀 Próximo Passo

1. **Configure** as 3 variáveis obrigatórias acima
2. **Salve** as variáveis
3. **Clique em "Implantar"** (botão verde)
4. **Aguarde** 2-5 minutos
5. **Teste**:
   ```
   curl http://187.77.32.172:3000/api/v1/health
   ```

---

## ⚠️ IMPORTANTE

**Qual é sua SENHA DO SUPABASE POSTGRESQL?**

(Aquele `SUPABASE_PASSWORD` acima - você precisa informar)

Depois disso, está 100% pronto para deploy!
