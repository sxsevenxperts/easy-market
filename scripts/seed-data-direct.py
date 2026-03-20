#!/usr/bin/env python3

"""
Seed data diretamente no PostgreSQL do Supabase
"""

import psycopg2
from datetime import datetime, timedelta
import random
import sys

# Conexão Supabase PostgreSQL
SUPABASE_HOST = "qfkwqfrnemqregjqxkcr.supabase.co"
SUPABASE_DB = "postgres"
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = "Jacyara.10davimaria"
SUPABASE_PORT = 5432

def connect():
    """Conectar ao PostgreSQL"""
    try:
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            port=SUPABASE_PORT,
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar: {str(e)}")
        sys.exit(1)

def seed_data():
    """Inserir dados fictícios"""
    conn = connect()
    cursor = conn.cursor()

    try:
        print("🚀 Iniciando seed de dados no Supabase...\n")

        # 1. Criar loja
        print("📦 Criando loja...")
        cursor.execute("""
            INSERT INTO lojas (nome, endereco, cidade, estado, cep, telefone, email, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            'Loja Super LAgoa Junco',
            'Avenida Principal, Bairro Lagoa Junco',
            'Recife',
            'PE',
            '52000-000',
            '(81) 3333-3333',
            'sevenxpertssxacademy@gmail.com',
            'ativa'
        ))
        loja_id = cursor.fetchone()[0]
        conn.commit()
        print(f"✅ Loja criada: {loja_id}\n")

        # 2. Criar produtos
        print("📦 Criando 24 produtos...")
        produtos_data = {
            'Refrigerante 2L': ('Bebidas', 5.50),
            'Suco Natural': ('Bebidas', 8.00),
            'Agua Mineral': ('Bebidas', 2.50),
            'Cerveja': ('Bebidas', 4.00),
            'Vinho': ('Bebidas', 25.00),
            'Feijao': ('Alimentos', 6.50),
            'Arroz': ('Alimentos', 4.50),
            'Macarrao': ('Alimentos', 2.50),
            'Oleo': ('Alimentos', 8.00),
            'Leite': ('Alimentos', 4.80),
            'Queijo': ('Alimentos', 18.00),
            'Sabonete': ('Higiene', 3.50),
            'Shampoo': ('Higiene', 12.00),
            'Desodorante': ('Higiene', 8.50),
            'Escova Dentes': ('Higiene', 5.50),
            'Detergente': ('Limpeza', 3.00),
            'Desinfetante': ('Limpeza', 4.50),
            'Papel Toalha': ('Limpeza', 7.50),
            'Sacos Lixo': ('Limpeza', 12.00),
            'Frutas': ('Perecíveis', 5.00),
            'Verduras': ('Perecíveis', 4.50),
            'Carnes': ('Perecíveis', 35.00),
            'Peixes': ('Perecíveis', 40.00),
            'Frango': ('Perecíveis', 18.00),
        }

        produtos_ids = {}
        for nome, (categoria, preco) in produtos_data.items():
            cursor.execute("""
                INSERT INTO inventario (loja_id, nome_produto, categoria, preco_unitario, quantidade, dias_vencimento, status_estoque)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (loja_id, nome, categoria, preco, 100, 30, 'saudavel'))
            produtos_ids[nome] = cursor.fetchone()[0]

        conn.commit()
        print(f"✅ {len(produtos_ids)} produtos criados\n")

        # 3. Gerar vendas (365 dias)
        print("💰 Gerando 1 ano de vendas (365 dias)...")

        HORARIOS_MULTIPLICADORES = {
            0: 0.3, 1: 0.2, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2,
            6: 0.4, 7: 0.8, 8: 1.2, 9: 1.0, 10: 0.9, 11: 1.1,
            12: 1.4, 13: 1.3, 14: 1.0, 15: 0.8, 16: 1.1, 17: 1.3,
            18: 1.5, 19: 1.4, 20: 1.2, 21: 0.9, 22: 0.6, 23: 0.4,
        }

        PADROES_SAZONAIS = {
            0: 0.9, 1: 0.9, 2: 1.0, 3: 1.1, 4: 1.0, 5: 1.2,
            6: 1.1, 7: 1.1, 8: 1.0, 9: 1.1, 10: 1.3, 11: 1.5,
        }

        total_vendas = 0
        vendas = []
        data_inicio = datetime(2025, 3, 20)

        for dia in range(365):
            data = data_inicio + timedelta(days=dia)
            multiplicador_sazonal = PADROES_SAZONAIS[data.month - 1]
            num_transacoes = random.randint(5, 15)

            for t in range(num_transacoes):
                hora = random.randint(0, 23)
                minuto = random.randint(0, 59)

                data_venda = data.replace(hour=hora, minute=minuto)
                multiplicador_horario = HORARIOS_MULTIPLICADORES[hora]

                qtd_itens = random.randint(1, 8)
                faturamento = 0

                for i in range(qtd_itens):
                    produto_nome = random.choice(list(produtos_data.keys()))
                    preco = produtos_data[produto_nome][1]
                    quantidade = random.randint(1, 3)
                    faturamento += preco * quantidade

                faturamento *= multiplicador_horario * multiplicador_sazonal
                faturamento = round(faturamento, 2)

                vendas.append((loja_id, data_venda, faturamento, qtd_itens))
                total_vendas += 1

                # Inserir em lotes de 500
                if len(vendas) == 500:
                    cursor.executemany("""
                        INSERT INTO vendas (loja_id, data_venda, faturamento, quantidade)
                        VALUES (%s, %s, %s, %s)
                    """, vendas)
                    conn.commit()
                    vendas = []

            if (dia + 1) % 50 == 0:
                print(f"  ✓ {dia + 1}/365 dias")

        # Inserir vendas restantes
        if vendas:
            cursor.executemany("""
                INSERT INTO vendas (loja_id, data_venda, faturamento, quantidade)
                VALUES (%s, %s, %s, %s)
            """, vendas)
            conn.commit()

        print(f"✅ {total_vendas} transações geradas\n")

        # 4. Gerar alertas
        print("⚠️  Gerando alertas...")
        alertas = []
        num_alertas = int(total_vendas * 0.1)
        tipos = ['falta_estoque', 'desperdicio', 'preco_anormal', 'vencimento']

        for i in range(num_alertas):
            tipo = random.choice(tipos)
            urgencia = 'alta' if random.random() > 0.7 else 'media'
            roi = random.randint(50, 550)
            status = 'resolvido' if random.random() > 0.5 else 'pendente'
            alertas.append((loja_id, tipo, urgencia, roi, status, datetime.now()))

            if len(alertas) == 500:
                cursor.executemany("""
                    INSERT INTO alertas (loja_id, tipo, urgencia, valor_roi_estimado, status, data_criacao)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, alertas)
                conn.commit()
                alertas = []

        if alertas:
            cursor.executemany("""
                INSERT INTO alertas (loja_id, tipo, urgencia, valor_roi_estimado, status, data_criacao)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, alertas)
            conn.commit()

        print(f"✅ {num_alertas} alertas gerados\n")

        # 5. Criar contato
        print("👤 Criando contato de teste...")
        cursor.execute("""
            INSERT INTO notificacao_contatos
            (loja_id, nome, cargo, setores, telefone_whatsapp, email, ativo,
             receber_alertas_criticos, receber_alertas_whatsapp, receber_alertas_email, receber_relatorios)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            loja_id, 'Gerente Teste', 'Gerente Geral',
            ['Bebidas', 'Alimentos', 'Higiene', 'Limpeza', 'Perecíveis'],
            '+5511999999999', 'sevenxpertssxacademy@gmail.com', True,
            True, True, True, True
        ))
        conn.commit()
        print("✅ Contato criado\n")

        # 6. Criar relatório agendado
        print("📧 Criando relatório agendado...")
        cursor.execute("""
            INSERT INTO relatorios_agendados
            (loja_id, tipo, hora, destinatarios, incluir_analise_impacto, ativo)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            loja_id, 'diario', '09:00',
            ['sevenxpertssxacademy@gmail.com'], True, True
        ))
        conn.commit()
        print("✅ Relatório agendado criado\n")

        print('=' * 50)
        print("🎉 SETUP CONCLUÍDO COM SUCESSO!\n")
        print("📊 RESUMO FINAL:")
        print(f"  • Loja: Loja Super LAgoa Junco")
        print(f"  • Loja ID: {loja_id}")
        print(f"  • Período: 20/03/2025 até 20/03/2026")
        print(f"  • Total de transações: {total_vendas}")
        print(f"  • Total de produtos: 24")
        print(f"  • Total de alertas: {num_alertas}")
        print(f"  • Contato: Gerente Teste")
        print(f"  • Relatório: Diário às 09:00")
        print('=' * 50 + '\n')
        print("✅ Dados prontos para análise!\n")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        conn.rollback()
        cursor.close()
        conn.close()
        sys.exit(1)

if __name__ == '__main__':
    seed_data()
