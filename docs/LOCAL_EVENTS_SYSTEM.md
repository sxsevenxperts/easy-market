# Easy Market — Sistema de Eventos Locais e Festividades

## Objetivo

Capturar **automaticamente** feriados nacionais, estaduais, municipais e festividades locais para prever impacto no consumo com precisão máxima.

---

## 1. Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────┐
│           Fontes de Eventos                              │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐   │
│  │ IBGE API    │ │ Google Cal  │ │ Wikimedia        │   │
│  │ Feriados BR │ │ Feriados    │ │ Festividades     │   │
│  └─────────────┘ └─────────────┘ └──────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│       Parser & Normalizador                             │
│  ├─ Extrai data, tipo, descrição                        │
│  ├─ Normaliza formatos diferentes                       │
│  └─ Detecta duplicatas                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│  Banco de Dados (calendario_eventos)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Nacional │ │ Estadual │ │ Municipal│                │
│  └──────────┘ └──────────┘ └──────────┘                │
│  ┌──────────────────────────────────────┐              │
│  │ Festividades + Impacto no Consumo    │              │
│  └──────────────────────────────────────┘              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│   Dashboard de Eventos (Gerente)                        │
│  ├─ Visualiza eventos próximos                          │
│  ├─ Edita festividades locais                           │
│  └─ Calibra impacto esperado                            │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Dados Necessários

### 2.1 Feriados Nacionais (IBGE)

**API:** https://www.ibge.gov.br/apps/calendario/

```python
import requests
from datetime import datetime

def fetch_national_holidays(ano):
    """
    Busca feriados nacionais do Brasil via IBGE
    """
    url = f"https://www.ibge.gov.br/apps/calendario/"
    
    # Estrutura esperada:
    feriados_nacionais = [
        {
            'data': '2026-01-01',
            'nome': 'Confraternização Universal',
            'tipo': 'feriado_nacional',
            'ponto': True,  # É ponto facultativo?
            'descricao': 'Ano Novo'
        },
        {
            'data': '2026-02-17',
            'nome': 'Carnaval',
            'tipo': 'carnaval',
            'ponto': True,
            'descricao': 'Carnaval - segundo dia'
        },
        {
            'data': '2026-03-13',
            'nome': 'Sexta-feira da Paixão',
            'tipo': 'feriado_nacional',
            'ponto': False,
            'descricao': 'Semana Santa'
        },
        {
            'data': '2026-04-21',
            'nome': 'Tiradentes',
            'tipo': 'feriado_nacional',
            'ponto': True,
            'descricao': 'Inconfidência Mineira'
        },
        {
            'data': '2026-05-01',
            'nome': 'Dia do Trabalho',
            'tipo': 'feriado_nacional',
            'ponto': True,
            'descricao': 'Dia internacional do trabalho'
        },
        {
            'data': '2026-09-07',
            'nome': 'Independência',
            'tipo': 'feriado_nacional',
            'ponto': True,
            'descricao': 'Independência do Brasil'
        },
        {
            'data': '2026-10-12',
            'nome': 'Nossa Senhora Aparecida',
            'tipo': 'feriado_nacional',
            'ponto': True,
            'descricao': 'Padroeira do Brasil'
        },
        {
            'data': '2026-11-02',
            'nome': 'Finados',
            'tipo': 'feriado_nacional',
            'ponto': True,
            'descricao': 'Dia de Finados'
        },
        {
            'data': '2026-11-15',
            'nome': 'Proclamação da República',
            'tipo': 'feriado_nacional',
            'ponto': True,
            'descricao': 'Proclamação da República'
        },
        {
            'data': '2026-11-20',
            'nome': 'Consciência Negra',
            'tipo': 'feriado_nacional',
            'ponto': True,
            'descricao': 'Dia da Consciência Negra'
        },
        {
            'data': '2026-12-25',
            'nome': 'Natal',
            'tipo': 'feriado_nacional',
            'ponto': True,
            'descricao': 'Natal - Nascimento de Jesus'
        }
    ]
    
    return feriados_nacionais
```

---

### 2.2 Feriados Estaduais (Por UF)

```python
def fetch_state_holidays(estado, ano):
    """
    Feriados específicos de cada estado
    """
    
    feriados_por_estado = {
        'CE': [  # Ceará
            {
                'data': '2026-06-10',
                'nome': 'Corpus Christi',
                'tipo': 'feriado_estadual',
                'ponto': True,
                'descricao': 'Corpus Christi - movível'
            }
        ],
        'PE': [  # Pernambuco
            {
                'data': '2026-06-24',
                'nome': 'São João',
                'tipo': 'festa_junina',
                'ponto': True,
                'descricao': 'Festa de São João de Pernambuco'
            },
            {
                'data': '2026-11-16',
                'nome': 'Zumbi dos Palmares',
                'tipo': 'feriado_estadual',
                'ponto': True,
                'descricao': 'Dia Nacional de Zumbi e Resistência Negra'
            }
        ],
        'BA': [  # Bahia
            {
                'data': '2026-06-24',
                'nome': 'São João da Bahia',
                'tipo': 'festa_junina',
                'ponto': False,
                'descricao': 'Festa de São João (não oficial, mas celebrado)'
            }
        ],
        'PB': [  # Paraíba
            {
                'data': '2026-08-05',
                'nome': 'Fundação da Paraíba',
                'tipo': 'feriado_estadual',
                'ponto': True,
                'descricao': 'Aniversário da Paraíba'
            }
        ],
        'RN': [  # Rio Grande do Norte
            {
                'data': '2026-06-24',
                'nome': 'São João do RN',
                'tipo': 'festa_junina',
                'ponto': False,
                'descricao': 'Festas Juninas de Parnamirim e Caicó'
            }
        ]
    }
    
    return feriados_por_estado.get(estado, [])
```

---

### 2.3 Festividades Municipais (Customizáveis)

**Tabela: `festividades_municipais`**

```sql
CREATE TABLE festividades_municipais (
  id SERIAL PRIMARY KEY,
  municipio TEXT NOT NULL,
  estado TEXT NOT NULL,
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  tipo TEXT, -- 'festa_santo', 'carnaval_local', 'aniversario_cidade', 'festa_cultural'
  descricao TEXT,
  impacto_esperado_percentual INT DEFAULT 0, -- +30%, +50%, etc
  categorias_afetadas TEXT[], -- JSON: ["Bebidas", "Carnes", "Pão"]
  imagem_url TEXT,
  site_oficial TEXT,
  is_feriado_ponto BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exemplos:
INSERT INTO festividades_municipais (municipio, estado, nome, data_inicio, data_fim, tipo, descricao, impacto_esperado_percentual, categorias_afetadas, is_feriado_ponto) VALUES
  ('Fortaleza', 'CE', 'São João de Fortaleza', '2026-06-01', '2026-06-30', 'festa_junina', 'Festas de São João com barracas, comidas típicas', 80, '["Bebidas", "Milho", "Pão de Queijo", "Caldo de Cana"]', false),
  ('Recife', 'PE', 'Frevo e Maracatu', '2026-02-15', '2026-02-18', 'carnaval_local', 'Carnaval pernambucano - Frevo', 120, '["Bebidas", "Salgados", "Carnes"]', true),
  ('Caruaru', 'PE', 'Festa de São João de Caruaru', '2026-06-13', '2026-06-24', 'festa_junina', 'Maior festa junina do Brasil', 150, '["Bebidas", "Milho", "Pão de Queijo", "Caldo de Cana", "Carnes"]', false),
  ('Soure', 'PB', 'Festa de São João de Soure', '2026-06-10', '2026-06-24', 'festa_junina', 'Festa junina na Paraíba', 100, '["Bebidas", "Milho", "Pão de Queijo"]', false),
  ('Fortaleza', 'CE', 'Aniversário de Fortaleza', '2026-04-13', '2026-04-13', 'aniversario_cidade', 'Aniversário de Fortaleza', 25, '["Bebidas", "Carnes"]', false),
  ('Natal', 'RN', 'Festa de Natal', '2026-12-01', '2026-12-25', 'natal_decorado', 'Decoração e festas de Natal', 60, '["Bebidas", "Carnes", "Pão", "Doces"]', false),
  ('Maceió', 'AL', 'Festa de São Jorge', '2026-04-23', '2026-04-23', 'festa_santo', 'Santo Padroeiro de Maceió', 35, '["Bebidas", "Salgados"]', false);
```

---

## 3. Integração com APIs Externas

### 3.1 Google Calendar API (Calendários Públicos)

```python
from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime, timedelta

def fetch_google_calendar_events(calendar_id, estado, municipio):
    """
    Busca eventos de calendários públicos do Google
    
    Exemplos de calendários:
    - Feriados Brasil: pt_br.official#holiday@group.v.calendar.google.com
    - Eventos CE: pt_br.ce#holiday@group.v.calendar.google.com
    """
    
    SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
    
    credentials = service_account.Credentials.from_service_account_file(
        'credentials.json',
        scopes=SCOPES
    )
    
    service = build('calendar', 'v3', credentials=credentials)
    
    # Busca eventos do próximo ano
    now = datetime.utcnow().isoformat() + 'Z'
    end_date = (datetime.utcnow() + timedelta(days=365)).isoformat() + 'Z'
    
    events_result = service.events().list(
        calendarId=calendar_id,
        timeMin=now,
        timeMax=end_date,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    
    return events
```

### 3.2 iCalendar Parser

```python
import icalendar
from datetime import datetime

def parse_ical_events(ical_url):
    """
    Parse iCalendar (ICS) de qualquer fonte
    
    Exemplos:
    - https://www.calendarindex.com/ics/brasil-feriados
    - Calendários de prefeituras
    """
    
    import requests
    
    response = requests.get(ical_url)
    cal = icalendar.Calendar.from_ical(response.content)
    
    eventos = []
    
    for component in cal.walk():
        if component.name == "VEVENT":
            evento = {
                'data': component.get('dtstart').dt,
                'nome': str(component.get('summary')),
                'descricao': str(component.get('description', '')),
                'local': str(component.get('location', '')),
                'tipo': 'ical_importado'
            }
            eventos.append(evento)
    
    return eventos
```

### 3.3 Wikimedia API (Festividades Locais)

```python
import requests

def fetch_wikipedia_festivities(municipio, estado):
    """
    Busca informações de festividades no Wikipedia
    
    Exemplo: "São João de Caruaru"
    """
    
    search_url = "https://pt.wikipedia.org/w/api.php"
    
    params = {
        'action': 'query',
        'format': 'json',
        'list': 'search',
        'srsearch': f'{municipio} festividades eventos {estado}'
    }
    
    response = requests.get(search_url, params=params)
    results = response.json()
    
    festivities = []
    
    for result in results['query']['search'][:3]:  # Top 3 resultados
        page_title = result['title']
        
        # Busca conteúdo da página
        content_params = {
            'action': 'query',
            'format': 'json',
            'titles': page_title,
            'prop': 'extracts',
            'explaintext': True
        }
        
        content_response = requests.get(search_url, params=content_params)
        pages = content_response.json()['query']['pages']
        
        for page_id, page_data in pages.items():
            extract = page_data.get('extract', '')
            
            festivities.append({
                'nome': page_title,
                'descricao': extract[:500],  # Primeiros 500 chars
                'source': 'wikipedia',
                'url': f'https://pt.wikipedia.org/wiki/{page_title}'
            })
    
    return festivities
```

---

## 4. Banco de Dados Consolidado

### Schema Unificado

```sql
CREATE TABLE calendario_eventos (
  id SERIAL PRIMARY KEY,
  
  -- Localização
  loja_id TEXT REFERENCES lojas(loja_id),
  municipio TEXT NOT NULL,
  estado TEXT NOT NULL,
  
  -- Evento
  data_inicio DATE NOT NULL,
  data_fim DATE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL, -- 'feriado_nacional', 'feriado_estadual', 'festa_junina', 'carnaval_local', 'santo_padroeiro', etc
  
  -- Importância
  nivel_impacto TEXT, -- 'alto', 'médio', 'baixo'
  impacto_esperado_percentual INT DEFAULT 0, -- +50%, +80%, etc
  
  -- Categorias Afetadas (JSON)
  categorias_afetadas JSONB DEFAULT '{}',  -- {"Bebidas": 50, "Carnes": 30, "Massas": -20}
  
  -- Configurações
  is_feriado_ponto BOOLEAN DEFAULT FALSE,
  fecha_loja BOOLEAN DEFAULT FALSE,
  horario_funcionamento_especial TEXT, -- "09:00-20:00" para dias diferentes
  
  -- Rastreabilidade
  fonte TEXT, -- 'ibge', 'google_calendar', 'wikipedia', 'manual'
  url_fonte TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Índices para busca rápida
CREATE INDEX idx_calendario_loja_data ON calendario_eventos(loja_id, data_inicio);
CREATE INDEX idx_calendario_municipio ON calendario_eventos(municipio, estado);
CREATE INDEX idx_calendario_tipo ON calendario_eventos(tipo);
```

---

## 5. Sistema de Sincronização Automática

```python
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta

class CalendarSyncManager:
    def __init__(self, db_connection):
        self.db = db_connection
        self.scheduler = BackgroundScheduler()
    
    def start_sync_jobs(self):
        """
        Inicia jobs de sincronização automática
        """
        
        # Sincronizar feriados nacionais (1x por mês)
        self.scheduler.add_job(
            self.sync_national_holidays,
            'cron',
            day=1,  # Primeiro dia do mês
            hour=2,
            minute=0,
            id='sync_national_holidays'
        )
        
        # Sincronizar feriados estaduais/municipais (1x por trimestre)
        self.scheduler.add_job(
            self.sync_state_municipalities_holidays,
            'cron',
            month='1,4,7,10',
            day=1,
            hour=3,
            minute=0,
            id='sync_state_municipal_holidays'
        )
        
        # Atualizar festividades locais (1x por semana)
        self.scheduler.add_job(
            self.sync_local_festivities,
            'cron',
            day_of_week='0',  # Domingo
            hour=4,
            minute=0,
            id='sync_local_festivities'
        )
        
        # Sincronizar calendários Google (2x por semana)
        self.scheduler.add_job(
            self.sync_google_calendars,
            'cron',
            day_of_week='2,5',  # Terça e Sexta
            hour=5,
            minute=0,
            id='sync_google_calendars'
        )
        
        self.scheduler.start()
    
    def sync_national_holidays(self):
        """Sincroniza feriados nacionais"""
        print("[SYNC] Sincronizando feriados nacionais...")
        
        holidays = fetch_national_holidays(datetime.now().year)
        
        for holiday in holidays:
            # Verifica se já existe
            existing = self.db.query(
                "SELECT id FROM calendario_eventos WHERE data_inicio = %s AND tipo = %s",
                (holiday['data'], 'feriado_nacional')
            )
            
            if not existing:
                self.db.execute(
                    """
                    INSERT INTO calendario_eventos 
                    (data_inicio, nome, descricao, tipo, fonte, municipio, estado, is_feriado_ponto)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (holiday['data'], holiday['nome'], holiday['descricao'], 
                     holiday['tipo'], 'ibge', 'Brasil', 'BR', holiday['ponto'])
                )
        
        self.db.commit()
        print("[✓] Feriados nacionais sincronizados")
    
    def sync_state_municipalities_holidays(self):
        """Sincroniza feriados estaduais e municipais"""
        print("[SYNC] Sincronizando feriados estaduais e municipais...")
        
        # Pega todas as lojas únicas por estado/município
        lojas = self.db.query("""
            SELECT DISTINCT estado, municipio FROM lojas
        """)
        
        for loja in lojas:
            estado = loja['estado']
            municipio = loja['municipio']
            
            # Feriados estaduais
            state_holidays = fetch_state_holidays(estado, datetime.now().year)
            for holiday in state_holidays:
                self._insert_or_update_event(holiday, municipio, estado)
            
            # Festividades municipais
            wiki_festivities = fetch_wikipedia_festivities(municipio, estado)
            for fest in wiki_festivities:
                self._insert_or_update_event(fest, municipio, estado)
        
        self.db.commit()
        print("[✓] Feriados estaduais/municipais sincronizados")
    
    def _insert_or_update_event(self, event, municipio, estado):
        """Helper para inserir ou atualizar evento"""
        
        existing = self.db.query(
            """SELECT id FROM calendario_eventos 
               WHERE data_inicio = %s AND nome = %s AND municipio = %s""",
            (event.get('data'), event.get('nome'), municipio)
        )
        
        if not existing:
            self.db.execute(
                """
                INSERT INTO calendario_eventos 
                (data_inicio, nome, descricao, tipo, fonte, municipio, estado)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (event.get('data'), event.get('nome'), event.get('descricao', ''),
                 event.get('tipo', 'evento_local'), event.get('source', 'manual'),
                 municipio, estado)
            )
```

---

## 6. API para Gerenciar Festividades Locais

### Endpoint: GET `/api/v1/eventos/:loja_id`

```json
{
  "loja_id": "loja-fortaleza-001",
  "municipio": "Fortaleza",
  "estado": "CE",
  "proximos_30_dias": [
    {
      "data": "2026-03-21",
      "nome": "Confraternização Universal (Ano Novo)",
      "tipo": "feriado_nacional",
      "descricao": "Feriado nacional",
      "impacto_percentual": 5,
      "categorias_afetadas": {
        "Bebidas": 20,
        "Carnes": 5
      },
      "recomendacoes": {
        "estoque": "+20% bebidas, +5% carnes",
        "escala": "Normal (em geral, movimentação baixa no Ano Novo)",
        "promo": "Promo em bebidas para reveillon"
      }
    },
    {
      "data": "2026-06-01",
      "nome": "Festas de São João de Fortaleza",
      "tipo": "festa_junina",
      "data_fim": "2026-06-30",
      "descricao": "Mês inteiro de festas juninas com barracas e comidas típicas",
      "impacto_percentual": 80,
      "categorias_afetadas": {
        "Bebidas": 80,
        "Milho": 150,
        "Pão de Queijo": 120,
        "Caldo de Cana": 200,
        "Carnes": 40
      },
      "recomendacoes": {
        "estoque": "+150% milho, +120% pão de queijo, +200% caldo de cana",
        "escala": "+50% funcionários (especialmente vendedores de bebidas)",
        "promo": "Bundles de bebida + comida junina",
        "fornecedores": "Avisar reposição para todos os itens juninos"
      }
    }
  ]
}
```

### Endpoint: POST `/api/v1/eventos/:loja_id` (Customizar)

```json
{
  "data_inicio": "2026-04-13",
  "nome": "Aniversário de Fortaleza",
  "tipo": "aniversario_cidade",
  "descricao": "Aniversário de Fortaleza - celebração local",
  "impacto_percentual": 25,
  "categorias_afetadas": {
    "Bebidas": 40,
    "Carnes": 20,
    "Pão": 15
  },
  "recomendacoes_customizadas": {
    "estoque": "+40% bebidas para o fim de semana seguinte",
    "fechamento_especial": false
  }
}
```

---

## 7. Dashboard: Visualização de Eventos

```
┌─────────────────────────────────────────────────────────┐
│ 📅 Eventos de Fortaleza - Próximos 30 Dias              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📍 Fortaleza, CE                                        │
│                                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🔴 [ALTO IMPACTO] São João de Fortaleza         │   │
│ │    01/06 até 30/06                              │   │
│ │    Impacto: +80% geral                           │   │
│ │    Categorias: Bebidas ↑80%, Milho ↑150%        │   │
│ │                                                  │   │
│ │    ✅ Ver Recomendações                         │   │
│ │    ✏️  Editar Festividade                       │   │
│ └──────────────────────────────────────────────────┘   │
│                                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🟡 [MÉDIO IMPACTO] Aniversário de Fortaleza     │   │
│ │    13/04 (segunda-feira)                         │   │
│ │    Impacto: +25% geral                           │   │
│ │    Categorias: Bebidas ↑40%, Carnes ↑20%        │   │
│ │                                                  │   │
│ │    ✅ Ver Recomendações                         │   │
│ │    ✏️  Editar Festividade                       │   │
│ └──────────────────────────────────────────────────┘   │
│                                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🟢 [BAIXO IMPACTO] Confraternização Universal   │   │
│ │    01/01 (já passou)                             │   │
│ │    Impacto: +5% geral                            │   │
│ └──────────────────────────────────────────────────┘   │
│                                                         │
│ [+ Adicionar Festividade Manual]                      │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Mapeamento por Região: Exemplos

### Nordeste do Brasil

```python
FESTIVIDADES_NORDESTE = {
    'Ceará': {
        'Fortaleza': [
            {
                'nome': 'Festas de São João de Fortaleza',
                'periodo': ('2026-06-01', '2026-06-30'),
                'impacto': 80,
                'categorias': {'Bebidas': 80, 'Milho': 150, 'Pão de Queijo': 120, 'Caldo de Cana': 200}
            },
            {
                'nome': 'Aniversário de Fortaleza',
                'periodo': ('2026-04-13', '2026-04-13'),
                'impacto': 25,
                'categorias': {'Bebidas': 40, 'Carnes': 20}
            }
        ]
    },
    
    'Pernambuco': {
        'Recife': [
            {
                'nome': 'Frevo e Maracatu (Carnaval PE)',
                'periodo': ('2026-02-15', '2026-02-18'),
                'impacto': 120,
                'categorias': {'Bebidas': 120, 'Salgados': 100, 'Carnes': 60}
            }
        ],
        'Caruaru': [
            {
                'nome': 'Festa de São João de Caruaru (Maior festa junina do Brasil)',
                'periodo': ('2026-06-13', '2026-06-24'),
                'impacto': 150,
                'categorias': {'Bebidas': 100, 'Milho': 200, 'Pão de Queijo': 150, 'Carnes': 80}
            }
        ]
    },
    
    'Paraíba': {
        'Campina Grande': [
            {
                'nome': 'Festa de São João de Campina Grande',
                'periodo': ('2026-06-10', '2026-06-24'),
                'impacto': 140,
                'categorias': {'Bebidas': 140, 'Milho': 180, 'Pão de Queijo': 140}
            }
        ],
        'Soure': [
            {
                'nome': 'Festa de São João de Soure',
                'periodo': ('2026-06-10', '2026-06-24'),
                'impacto': 100,
                'categorias': {'Bebidas': 100, 'Milho': 120, 'Pão de Queijo': 100}
            }
        ]
    },
    
    'Bahia': {
        'Salvador': [
            {
                'nome': 'Festa de Iemanjá',
                'periodo': ('2026-02-02', '2026-02-02'),
                'impacto': 50,
                'categorias': {'Bebidas': 70, 'Frutas': 50}
            }
        ]
    },
    
    'Rio Grande do Norte': {
        'Natal': [
            {
                'nome': 'Festa Natalina de Natal',
                'periodo': ('2026-12-01', '2026-12-25'),
                'impacto': 100,
                'categorias': {'Bebidas': 100, 'Carnes': 80, 'Pão': 60}
            }
        ]
    }
}
```

---

## 9. Integração com Motor Preditivo

```python
def apply_event_impact_to_forecast(forecast, event, categoria):
    """
    Ajusta previsão baseado em evento local
    """
    
    if event['nome'] == 'Festas de São João de Fortaleza':
        if categoria == 'Bebidas':
            # Aumenta previsão em 80%
            forecast['yhat'] = forecast['yhat'] * 1.8
            forecast['yhat_lower'] = forecast['yhat_lower'] * 1.5
            forecast['yhat_upper'] = forecast['yhat_upper'] * 2.0
        
        elif categoria == 'Sorvete':
            # Diminui (menos gelado em festas, mais quente)
            forecast['yhat'] = forecast['yhat'] * 0.8
    
    return forecast
```

---

## 10. Checklist de Implementação

- [ ] Schema SQL: `calendario_eventos`
- [ ] API IBGE: sync feriados nacionais
- [ ] Google Calendar: integração de calendários públicos
- [ ] Wikipedia parser: festividades locais
- [ ] APScheduler: jobs de sincronização automática
- [ ] POST/GET endpoints para eventos
- [ ] Dashboard de visualização
- [ ] Mapeamento regionalizado (Nordeste, SE, Sul, etc)
- [ ] Integração com motor preditivo
- [ ] Admin panel para editar festividades manualmente
- [ ] Notificações para gerente (próximo evento em 7 dias)

---

**Resultado Final:** Sistema que captura **100% dos eventos que impactam consumo**, desde feriados nacionais até a festa de santo do seu município.
