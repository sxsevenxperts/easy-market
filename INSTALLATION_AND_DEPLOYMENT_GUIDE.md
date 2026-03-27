# 🏪 Smart Market - Guia de Instalação para Supermercados e Padarias

**Versão**: 3.0  
**Data**: Março 2026  
**Desenvolvido por**: Seven Xperts CNPJ 32.794.007/0001-19

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Requisitos de Hardware](#requisitos-de-hardware)
3. [Instalação Pré-Instalação](#instalação-pré-instalação)
4. [Instalação Local (Single Store)](#instalação-local-single-store)
5. [Instalação em Rede (Multi-Loja)](#instalação-em-rede-multi-loja)
6. [Integração com PDV/Caixa](#integração-com-pdvcaixa)
7. [Configuração Inicial](#configuração-inicial)
8. [Treinamento de Pessoal](#treinamento-de-pessoal)
9. [Operação Diária](#operação-diária)
10. [Manutenção e Atualizações](#manutenção-e-atualizações)
11. [Troubleshooting](#troubleshooting)
12. [Suporte Técnico](#suporte-técnico)

---

## Visão Geral

O **Smart Market v3.0** é um sistema de inteligência de varejo que monitora em tempo real:
- **50 variáveis** de fluxo de loja (clima, economia, eventos, concorrentes)
- **Previsões** de vendas com EMA e ajustes por dia da semana
- **Anomalias** detectadas automaticamente (z-score)
- **RFM** segmentation (cliente premium, regular, em risco)
- **Taxa de saída** de produtos (produtos que deixam de ser vendidos)
- **Cross-sell e Up-sell** inteligentes
- **Análise textual** preditiva de eventos

### Benefícios Esperados

| Métrica | Antes | Depois (3 meses) |
|---------|--------|-----------------|
| Previsão de Vendas | ±15% | ±5% |
| Perda por Obsolescência | 3-4% | <1% |
| Cross-sell realizado | 5% | 18-22% |
| Identificação de tendências | Manual | Automática |

---

## Requisitos de Hardware

### Opção 1: Instalação Mínima (Padaria/Pequeno Comércio)

```
Server Central:
├─ Processador: Intel i3 ou AMD Ryzen 3 (4 núcleos)
├─ Memória RAM: 8 GB
├─ Armazenamento: SSD 256 GB
├─ Conexão: Internet 10 Mbps (upload/download)
└─ Uptime: 99%+ (UPS recomendado)

Clientes:
├─ Tablets/PCs no checkout (já existentes geralmente)
├─ 1 monitor 24" para dashboard gerencial
└─ Conexão: WiFi 5GHz ou Ethernet (recomendado)
```

**Custo**: ~R$ 3.500-5.000 (server) + R$ 1.500 (monitor)

---

### Opção 2: Instalação Média (Supermercado 1-3 Caixas)

```
Server Central:
├─ Processador: Intel i7 ou AMD Ryzen 7 (8 núcleos)
├─ Memória RAM: 16 GB
├─ Armazenamento: SSD 512 GB + HDD 1 TB backup
├─ Conexão: Internet 50 Mbps
├─ Cooling: Ventilação ativa ou ar condicionado
└─ Redundância: Fonte 80+ Bronze 650W

Infraestrutura:
├─ Switch PoE Gigabit 8 portas
├─ Cabeamento Cat 6 (redes estruturadas)
├─ UPS 1500 VA (proteção 30+ min)
└─ Access Point WiFi 6 (2.4GHz + 5GHz)

Clientes:
├─ Tablets 10" em cada caixa (2-3 unidades)
├─ 2 monitores 24" (gerência + operacional)
└─ Impressoras de cupom (já integradas ao PDV)
```

**Custo**: ~R$ 8.000-12.000 (infraestrutura total)

---

### Opção 3: Instalação Grande (Rede de Supermercados)

```
Infraestrutura em Nuvem (Recomendado):
├─ AWS/Azure/Google Cloud
├─ Load Balancer
├─ Database Supabase (PostgreSQL gerenciado)
├─ CDN para conteúdo estático
└─ Backup automático geo-redundante

Por Loja:
├─ Servidor local (Opção 2 acima)
├─ Internet 100 Mbps (redundância LTE)
├─ Sincronização 2-way com cloud (a cada 5 min)
└─ Cache local para offline operation

Sede:
├─ Dashboard centralizado
├─ Gerenciamento multi-loja
├─ Analytics avançadas
└─ Relatórios consolidados
```

**Custo**: ~R$ 15.000 infraestrutura local + ~R$ 500-1000/mês nuvem

---

## Instalação Pré-Instalação

### Checklist Pré-Instalação

- [ ] Diagnosticar conexão de internet (speedtest.net)
- [ ] Planejar layout de rede (onde fica o server)
- [ ] Obter acesso administrativo aos sistemas
- [ ] Backup de dados existentes do PDV
- [ ] Criar usuários de acesso
- [ ] Preparar documentação de PDV atual

### Documentação Necessária

```
Colete as seguintes informações:
├─ Nº máximo de SKUs (produtos)
├─ Nº de categorias de produtos
├─ Horário de funcionamento da loja
├─ Feriados/festividades locais
├─ Dados históricos de vendas (últimos 12 meses, se possível)
├─ Informações do PDV/caixa (marca, modelo, versão)
├─ Dados de integração com fornecedores
└─ Contato do responsável técnico local
```

---

## Instalação Local (Single Store)

### Passo 1: Preparar o Servidor

#### 1.1 Sistema Operacional (Linux recomendado para produção)

```bash
# Ubuntu Server 22.04 LTS (recomendado para produção)
# Ou Windows Server 2022 (mais fácil para iniciantes)

# Se Ubuntu:
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git
sudo apt install -y nodejs npm  # Node.js 18+
```

#### 1.2 Instalação do Node.js

```bash
# Verificar versão
node -v  # Deve ser v18.0.0 ou superior
npm -v   # Deve ser npm 8+

# Se precisar atualizar:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 1.3 Instalação do PostgreSQL (opcional, se não usar Supabase)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar usuário de banco
sudo -u postgres createuser smartmarket -P
sudo -u postgres createdb smartmarket -O smartmarket
```

---

### Passo 2: Clonar e Configurar Projeto

```bash
# Criar diretório
mkdir -p /opt/smart-market
cd /opt/smart-market

# Clonar repositório (ou copiar arquivos)
git clone https://seu-repo/smart-market.git .
# OU
# Extrair arquivo ZIP fornecido

# Instalar dependências
npm install

# Criar arquivo .env
cp backend/.env.example backend/.env
# OU criar manualmente:
```

### Passo 3: Configurar Variáveis de Ambiente

```bash
# Editar /opt/smart-market/backend/.env

# Opção A: Usar Supabase (Recomendado)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=seu-chave-service-key
SUPABASE_API_KEY=seu-chave-publica

# Opção B: Usar PostgreSQL Local
DB_HOST=localhost
DB_PORT=5432
DB_USER=smartmarket
DB_PASSWORD=sua-senha-segura
DB_NAME=smartmarket

# Configurações Gerais
NODE_ENV=production
PORT=3000
CORS_ORIGIN=http://localhost:3000,http://192.168.1.100:3000
ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000

# API Keys Opcionais
WEATHER_API_KEY=sua-chave-openweather
ECONOMIC_API_KEY=sua-chave-economia

# Sugestão: Deixar em branco para usar dados mock
```

### Passo 4: Inicializar Banco de Dados

```bash
# Se usando Supabase, a estrutura é criada automaticamente
# Se usando PostgreSQL local:

psql -U smartmarket -d smartmarket < backend/src/scrapers/migrations.sql

# Verificar se tabelas foram criadas:
psql -U smartmarket -d smartmarket -c "\dt"
# Deve listar:
# - store_flow_variables
# - variable_metadata
# - variable_correlations
# - scraper_logs
```

### Passo 5: Testes Iniciais

```bash
# Terminal 1: Iniciar servidor backend
cd /opt/smart-market
npm start

# Deve exibir:
# ╔══════════════════════════════════════════════════╗
# ║         SMART MARKET v3.0 — By Seven Xperts     ║
# ║  URL:    http://0.0.0.0:3000                    ║
# ║  Health: http://0.0.0.0:3000/health             ║
# ║  API:    http://0.0.0.0:3000/api/v1             ║
# ╚══════════════════════════════════════════════════╝
```

### Passo 6: Acessar a Aplicação

```
No navegador (da mesma rede):
http://localhost:3000          # No servidor
http://192.168.1.100:3000      # De outro computador
                               # (substitua 192.168.1.100 pelo IP real)
```

**Testes de Saúde**:
```bash
# Verificar status
curl http://localhost:3000/health

# Deve retornar:
{
  "sucesso": true,
  "servico": "smart-market-backend",
  "status": "online",
  "versao": "3.0",
  "supabase": "conectado ou não configurado",
  "uptime": 0
}
```

---

## Instalação em Rede (Multi-Loja)

### Para Rede de Supermercados

#### Arquitetura Recomendada

```
┌─────────────────────────────────────────────────┐
│                   CLOUD (Supabase)               │
│              Banco de Dados Centralizado         │
└────────────┬─────────────────────────────────────┘
             │
    ┌────────┴────────┬──────────────┬──────────┐
    │                 │              │          │
    v                 v              v          v
┌─────────┐      ┌─────────┐   ┌──────────┐ ┌──────────┐
│ Loja 1  │      │ Loja 2  │   │ Loja 3   │ │  Sede    │
│(Servidor)      │(Servidor)   │(Servidor)  │(Analytics)
└────┬────┘      └────┬────┘   └────┬──────┘ └──────────┘
     │                │             │
  [WiFi/Ethernet] [WiFi/Ethernet] [Fibra]
     │                │             │
  [Tablets]      [Tablets]     [Dashboard]
  [Monitores]    [Monitores]   Central
```

#### Configuração por Loja

**Loja 1 - São Paulo Centro**
```bash
# Criar diretório
mkdir -p /opt/smart-market-sp-centro
cd /opt/smart-market-sp-centro

# Copiar código
cp -r /opt/smart-market/* .

# Editar .env com dados da Loja 1
LOJA_ID=loja_sp_centro_001
LOJA_NOME=São Paulo - Centro
SUPABASE_URL=https://seu-projeto.supabase.co  # Mesmo para todas
SUPABASE_SERVICE_KEY=seu-chave-service-key     # Mesmo para todas

# Iniciar
npm start  # Rodará em http://localhost:3000
```

**Loja 2 - São Paulo Norte**
```bash
mkdir -p /opt/smart-market-sp-norte
# Repetir com LOJA_ID=loja_sp_norte_001
# Pode rodar em porta diferente (3001) se no mesmo server
PORT=3001 npm start
```

#### Dashboard da Sede

```bash
# Clonar projeto num servidor diferente (ou mesma máquina)
mkdir -p /opt/smart-market-hq
cd /opt/smart-market-hq

# Usar mesma configuração Supabase
# O frontend automaticamente carrega dados de TODAS as lojas
SUPABASE_URL=https://seu-projeto.supabase.co

npm start  # Acessa em http://localhost:3000
# Mostrará selector de loja ou dashboard consolidado
```

---

## Integração com PDV/Caixa

### Padrão 1: PDV Independente (Mais Comum)

**Fluxo de Dados**:
```
PDV/Caixa (vende produto)
         ↓
   Arquivo de vendas
         ↓
Smart Market (importa a cada 5 min)
         ↓
   Análises + Previsões
```

#### Como Configurar

**Exportar dados do PDV cada 5 minutos**:

```bash
# Script para Linux (crontab)
# Executar a cada 5 minutos

# 1. Editar crontab
crontab -e

# 2. Adicionar linha:
*/5 * * * * /opt/smart-market/export-pdv-vendas.sh

# 3. Criar script /opt/smart-market/export-pdv-vendas.sh
```

**Arquivo: export-pdv-vendas.sh**
```bash
#!/bin/bash

# Configurações
LOJA_ID="loja_001"
PDV_DB="/var/lib/pdv/vendas.db"  # Adapte ao seu PDV
OUTPUT="/opt/smart-market/imports/vendas.csv"
API_URL="http://localhost:3000/api/v1/importar-vendas"

# Exportar últimas vendas do PDV
# (Ajuste comando conforme seu PDV: SQLite, ODBC, MySQL, etc)
sqlite3 "$PDV_DB" \
  "SELECT sku, produto, categoria, quantidade, preco, data_hora 
   FROM vendas 
   WHERE data_hora > datetime('now', '-5 minutes');" > "$OUTPUT"

# Enviar para Smart Market
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"loja_id\": \"$LOJA_ID\", \"arquivo\": \"$(cat $OUTPUT | base64)\"}"

# Limpar
rm "$OUTPUT"
```

**PDVs Populares**:

| PDV | Método | Documentação |
|-----|--------|--------------|
| Microvix | ODBC/SQL | Contato suporte Microvix |
| Técnapolis | SQL Server | Consultar banco local |
| SAT (Fiscal) | Arquivo XML | Ler /SAT/venda.xml |
| PAF/ECF | Arquivo texto | Exportar via sistema |
| Custom | API/banco | Consulte seu desenvolvedor |

---

### Padrão 2: PDV Integrado (Mais Rápido)

Se o PDV suportar webhooks ou API:

```javascript
// No PDV, chamar esta rota quando venda é registrada:
async function registrarVenda(sku, quantidade, preco) {
  const response = await fetch('http://localhost:3000/api/v1/registrar-venda', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      loja_id: 'loja_001',
      sku,
      quantidade,
      preco,
      timestamp: new Date().toISOString()
    })
  });
  
  if (!response.ok) {
    console.error('Erro ao registrar venda:', await response.text());
  }
}
```

---

## Configuração Inicial

### Passo 1: Login e Acesso

```
1. Abrir navegador: http://192.168.1.100:3000
2. Tela de Login (se configurado)
   - Usuário: admin
   - Senha: (definir na primeira vez)
3. Clicar em "Configurações" ou ⚙️
```

### Passo 2: Cadastro da Loja

```
Configurações → Perfil da Loja

Preencher:
├─ Nome da Loja: "Supermercado XYZ - Centro"
├─ CNPJ: "XX.XXX.XXX/XXXX-XX"
├─ Endereço: "Rua X, nº 123, São Paulo, SP"
├─ Telefone: "(11) 3000-0000"
├─ Email: "gerente@supermercado.com.br"
├─ Gerente Responsável: "João da Silva"
├─ Horário Funcionamento: "08:00 às 22:00"
├─ Dias Operacionais: "Seg-Dom"
└─ Coordenadas GPS: "-23.5505, -46.6333"  (opcional)
```

### Passo 3: Configurar Assinatura

```
Configurações → Plano de Assinatura

Opções:
├─ Básico: R$ 299/mês
│  └─ Até 1 loja, 50 SKUs, dashboard básico
├─ Profissional: R$ 799/mês
│  └─ Até 5 lojas, 5000 SKUs, RFM + Anomalias
└─ Enterprise: Contato
   └─ Ilimitado, suporte 24/7, custom dev
```

### Passo 4: Importar Produtos (SKUs)

```
Configurações → Catálogo de Produtos

Opções:
1. Upload CSV
   ├─ Arquivo: produtos.csv
   ├─ Colunas esperadas:
   │  ├─ sku (obrigatório)
   │  ├─ nome (obrigatório)
   │  ├─ categoria
   │  ├─ subcategoria
   │  ├─ preco_custo
   │  ├─ preco_venda
   │  ├─ estoque
   │  └─ fornecedor
   └─ Botão: [Importar Produtos]

2. Integração com PDV
   ├─ Tipo: "Microvix" / "Técnapolis" / "Outro"
   └─ Sincronizar

3. Manual
   └─ Clicar [+ Novo Produto]
```

**Formato esperado (produtos.csv)**:
```csv
sku,nome,categoria,preco_venda,estoque
001234,Pão Francês,Padaria,0.70,150
001235,Bolo Chocolate,Padaria,12.50,45
001236,Leite Integral,Laticínios,4.50,200
```

### Passo 5: Configurar Variáveis de Monitoramento

```
Configurações → Scraper de Variáveis

Ativar/desativar as 50 variáveis conforme necessário:

Categoria: Clima
├─ ☑ Temperatura atual
├─ ☑ Precipitação
├─ ☑ Umidade do ar
└─ ...

Categoria: Eventos/Festividades
├─ ☑ Carnaval
├─ ☑ Black Friday
├─ ☑ Natal
└─ ...

Intervalo de coleta: [60] minutos
Armazenar histórico: [24] meses
```

### Passo 6: Configurar Alertas

```
Configurações → Alertas

1. Anomalias
   ├─ Sensibilidade: [Normal] / Baixa / Alta
   ├─ Z-score limite: [3.0]
   └─ Notificar: [Email] [SMS] [Push]

2. Previsões
   ├─ Alertar se MAPE > [10]%
   ├─ Alertar se desvio > [±20]%
   └─ Notificar: [Dashboard] [Whatsapp]

3. Estoque
   ├─ Produtos com estoque < [5]
   ├─ Produtos sem venda > [30] dias
   └─ Notificar: [Email gerente]
```

---

## Treinamento de Pessoal

### 1. Gerente/Responsável da Loja (4h)

**Módulo 1: Visão Geral (30 min)**
- O que é Smart Market
- Benefícios esperados
- KPIs principais
- Dashboard principal

**Módulo 2: Dashboards (1h)**
- Interpretação de gráficos
- Análise de tendências
- Identificação de anomalias
- Cross-sell e up-sell

**Módulo 3: Operações (1h 30)**
- Configurar alertas
- Gerar relatórios
- Exportar dados
- Integração com PDV

**Módulo 4: Casos de Uso (1h)**
- Análise: "Por que vendas caíram ontem?"
- Análise: "Como aumentar cross-sell?"
- Análise: "Quais produtos estão saindo?"

**Avaliação**: Quiz com 10 questões

---

### 2. Operacional/Caixa (2h)

**Módulo 1: Acesso (30 min)**
- Login no sistema
- Navegação básica
- Buscar informação de cliente

**Módulo 2: RFM do Cliente (1h)**
- Entender Cliente Premium
- Entender Cliente Regular
- Entender Cliente em Risco
- Oferecer cross-sell apropriado

**Módulo 3: Sugestões de Produto (30 min)**
- Quem mais compra este produto?
- Produtos frequentemente comprados juntos
- Oferecer combo

**Avaliação**: Prática no sistema

---

### 3. Técnico/TI (8h)

**Módulo 1: Arquitetura (2h)**
- Componentes do sistema
- Fluxo de dados
- Segurança e backups

**Módulo 2: Instalação e Configuração (3h)**
- Instalação completa
- Configuração de servidor
- Backup automático
- Monitoramento

**Módulo 3: Troubleshooting (2h)**
- Problemas comuns
- Logs do sistema
- Performance tuning
- Contato com suporte

**Módulo 4: Manutenção (1h)**
- Atualizações
- Segurança de dados
- Plano de recuperação de desastres

**Avaliação**: Setup completo de teste

---

### Material de Treinamento

```
Fornecer:
├─ Manual do Usuário (PDF)
├─ Vídeos tutoriais (YouTube unlisted)
├─ Guia rápido (laminated poster)
├─ FAQ documento
├─ Contatos de suporte
└─ Certificado de conclusão
```

---

## Operação Diária

### Checklist Diário (15 min)

```
☐ 08:30 - Gerente abre sistema
  ├─ Verificar anomalias da noite
  ├─ Ler alertas importantes
  └─ Revisar previsão do dia

☐ 12:00 - Meio do dia
  ├─ Verificar cross-sells realizados
  ├─ Confirmar estoque de itens em risco
  └─ Revisar performance vs previsão

☐ 18:00 - Final do expediente
  ├─ Exportar relatório do dia
  ├─ Revisar taxa de acerto previsões
  ├─ Notar anomalias para investigação
  └─ Planejar ações do dia seguinte
```

### Exemplo de Análise Diária

**Cenário: Vendas caíram 15% hoje**

1. Verificar Anomalias
   - Dashboard → Anomalias
   - Z-score > 3? → Sim, investigar
   
2. Verificar Variáveis
   - Choveu forte? → Sim (-25% esperado)
   - Feriado próximo? → Sim (-10% esperado)
   - Competidor fez promoção? → Não
   - Falta de estoque? → Não

3. Conclusão
   - Queda esperada = 10% (feriado) + 25% (chuva) = 35% teórico
   - Queda real = 15%
   - **Resultado**: Melhor que esperado! ✅

4. Ação
   - Nenhuma ação necessária
   - Documentar no relatório

---

### Exemplo: Aumentar Cross-Sell

1. Acessar: Dashboard → RFM → Clientes Premium

2. Sistema sugere:
   - Cliente João Silva: compra Carne + Pão
   - → Sugerir: Queijo, Vinho (margem 40-50%)

3. Treinar caixa:
   - "Sr. João, temos um ótimo queijo artesanal para acompanhar"

4. Medir resultado:
   - Semana 1: +5% cross-sell
   - Semana 2: +12% cross-sell
   - Mensal: +18% cross-sell realizado

---

### Relatório Semanal

```
Executar toda segunda-feira:

1. Acessar: Configurações → Gerar Relatório
2. Período: Semana anterior
3. Incluir:
   ├─ Resumo vendas
   ├─ Produtos mais vendidos
   ├─ Produtos sem venda
   ├─ Clientes novos
   ├─ Taxa de acerto previsões
   ├─ Anomalias detectadas
   ├─ Cross-sell realizado
   └─ Recomendações IA

4. Enviar para: gerente@loja.com.br
5. Revisar e discutir em reunião
```

---

## Manutenção e Atualizações

### Manutenção Semanal

```bash
# Toda segunda-feira, das 00:00 às 02:00

# 1. Backup dos dados
sudo /opt/smart-market/backup.sh

# 2. Verificar disco cheio
df -h /opt/smart-market
# Se > 90%: limpar logs antigos

# 3. Verificar performance
npm run health-check
# Se MAPE > 10%: investigar

# 4. Revisar logs de erro
tail -100 /opt/smart-market/logs/error.log
```

### Manutenção Mensal

```bash
# 1º dia do mês

# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Atualizar dependências Node
npm audit
npm audit fix

# 3. Otimizar banco de dados
npm run optimize-db

# 4. Revisar acessos
npm run audit-log --period=month

# 5. Testar backup de recuperação
npm run restore-backup --dry-run
```

### Atualização de Versão

**v3.0 → v3.1**:

```bash
# 1. Backup completo
sudo /opt/smart-market/backup.sh --full

# 2. Parar servidor
sudo systemctl stop smart-market

# 3. Atualizar código
cd /opt/smart-market
git pull origin v3.1
# OU: descarregar ZIP v3.1

# 4. Atualizar dependências
npm install

# 5. Migrar banco se necessário
npm run migrate

# 6. Testes
npm test

# 7. Iniciar
sudo systemctl start smart-market

# 8. Verificar saúde
curl http://localhost:3000/health
```

**Janela de manutenção**: Acordar com gerente
- Horário recomendado: 23:00 - 05:00 (fora do horário)
- Tempo esperado: 30-60 minutos
- Impacto: Sistema indisponível durante

---

## Troubleshooting

### Problema 1: Aplicação não abre

```
Sintoma: "Erro ao conectar" ou página em branco

Diagnóstico:
1. Verificar se servidor está rodando
   ps aux | grep node

2. Se não está:
   npm start
   (ou reiniciar via systemctl)

3. Verificar porta
   netstat -tlnp | grep 3000

4. Se porta em uso:
   lsof -i :3000
   kill -9 PID_DO_PROCESSO
   npm start

5. Verificar firewall
   sudo ufw status
   sudo ufw allow 3000/tcp
```

### Problema 2: Dados não sincronizam

```
Sintoma: Dados no PDV mas não aparecem no Smart Market

Diagnóstico:
1. Verificar conexão com banco
   npm run test-db

2. Verificar exportação do PDV
   cat /opt/smart-market/imports/vendas.csv
   (deve conter últimas vendas)

3. Verificar logs
   tail -50 /opt/smart-market/logs/sync.log

4. Resetar sincronização
   npm run reset-sync

5. Reimportar manualmente
   npm run import-csv --file=./vendas.csv
```

### Problema 3: Sistema lento

```
Sintoma: Dashboard demora para carregar ou fazer ação

Diagnóstico:
1. Verificar uso de CPU/RAM
   top
   (Press 'q' para sair)

2. Se > 80% RAM: reiniciar
   sudo systemctl restart smart-market

3. Verificar tamanho banco
   du -h /var/lib/postgresql/smartmarket
   (se > 10GB: limpar dados antigos)

4. Verificar consultas lentas
   npm run analyze-performance

5. Se problema persiste:
   npm run rebuild-index
```

### Problema 4: Alertas não chegam por Email

```
Sintoma: Email não está sendo enviado

Diagnóstico:
1. Verificar configuração de email
   cat /opt/smart-market/backend/.env | grep MAIL

2. Testar envio
   npm run test-email --to=seu@email.com

3. Verificar logs
   grep -i "email\|smtp" /opt/smart-market/logs/error.log

4. Reconfigurar SMTP
   # Editar .env com credenciais corretas
   # Gmail: ativar "senhas de aplicativo"
   # Outlook: usar IMAP
   # SendGrid: usar API key

5. Testar novamente
   npm run test-email
```

### Problema 5: Estoque não sincroniza com PDV

```
Sintoma: Quantidade no Smart Market diferente do PDV

Diagnóstico:
1. Verificar última sincronização
   npm run check-sync --loja=loja_001

2. Forçar sincronização
   npm run sync-inventory --force

3. Se diferença > 5 unidades:
   a) Fazer inventário manual no PDV
   b) Registrar quantidade correta
   c) Atualizar no Smart Market manualmente

4. Implementar webhook do PDV:
   Contate suporte para configurar integração em tempo real
```

---

## Suporte Técnico

### Contato Seven Xperts

```
📧 Email Técnico: suporte@sevenxperts.com.br
☎️  Telefone: (11) 3000-0000
💬 WhatsApp: (11) 99999-0000
🕐 Horário: Seg-Sex 09:00-18:00
🌐 Portal: https://suporte.sevenxperts.com.br
```

### Abrir Chamado de Suporte

```
1. Acessar: https://suporte.sevenxperts.com.br
2. Clicar: [Novo Chamado]
3. Preencher:
   ├─ Loja: [seleção]
   ├─ Prioridade: [Crítica/Alta/Normal/Baixa]
   ├─ Tipo: [Técnico/Funcional/Dúvida]
   ├─ Descrição: [detalhe do problema]
   ├─ Anexar logs: [arquivo de erro]
   └─ [Enviar Chamado]

4. Você receberá:
   ├─ Confirmação por email
   ├─ Numero do chamado: #123456
   └─ Tempo estimado de resposta
```

### Logs para Enviar ao Suporte

```bash
# Coletar logs relevantes
cd /opt/smart-market

# 1. Logs de erro
tail -100 logs/error.log > logs_erro_$(date +%Y%m%d).txt

# 2. Logs de sincronização
tail -50 logs/sync.log > logs_sync_$(date +%Y%m%d).txt

# 3. Status do sistema
npm run health-check > health_$(date +%Y%m%d).txt

# 4. Compactar
zip -j suporte_$(date +%Y%m%d).zip logs_*.txt health_*.txt

# 5. Enviar para suporte@sevenxperts.com.br
```

### SLA de Suporte

| Prioridade | Resposta | Resolução |
|-----------|----------|-----------|
| Crítica | 15 min | 2 horas |
| Alta | 1 hora | 8 horas |
| Normal | 4 horas | 24 horas |
| Baixa | 24 horas | 72 horas |

---

## Apêndice: Comandos Úteis

### Gerenciamento do Serviço

```bash
# Iniciar
sudo systemctl start smart-market

# Parar
sudo systemctl stop smart-market

# Reiniciar
sudo systemctl restart smart-market

# Status
sudo systemctl status smart-market

# Ver logs em tempo real
sudo journalctl -u smart-market -f

# Ativar para iniciar com boot
sudo systemctl enable smart-market
```

### Monitoramento

```bash
# Monitore em tempo real
watch -n 5 'curl -s http://localhost:3000/health | json_pp'

# Ou ver com jq
curl -s http://localhost:3000/health | jq '.'
```

### Backup e Restauração

```bash
# Backup manual completo
npm run backup -- --output=backup_$(date +%Y%m%d_%H%M%S).tar.gz

# Listar backups
ls -lh backups/

# Restaurar do backup
npm run restore -- --file=backup_20260322.tar.gz --dry-run
# Remove --dry-run para restaurar de verdade
```

---

## Conclusão

O Smart Market está pronto para ser instalado em sua loja. 

**Próximas ações**:
1. ✅ Cumprir checklist de pré-instalação
2. ✅ Executar instalação local ou em rede
3. ✅ Configurar integração com PDV
4. ✅ Treinar pessoal
5. ✅ Iniciar operação
6. ✅ Monitorar primeiro mês

**Resultados esperados** (primeiros 3 meses):
- ✅ Previsões com ±5% de precisão
- ✅ Cross-sell realizado: +18-22%
- ✅ Taxa de perda: <1%
- ✅ Identificação automática de tendências

---

**Desenvolvido por Seven Xperts CNPJ 32.794.007/0001-19**  
**Contato:** suporte@sevenxperts.com.br
