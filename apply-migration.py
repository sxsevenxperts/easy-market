#!/usr/bin/env python3
"""
Script para aplicar a migração 008_add_customer_analytics.sql no Supabase
Uso: python3 apply-migration.py
"""

import os
import psycopg2
from psycopg2 import sql

def apply_migration():
    # Configuração do banco - ajuste com seus valores do Supabase
    db_config = {
        'host': os.getenv('DB_HOST', 'db.YOUR_SUPABASE_ID.supabase.co'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'postgres'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', ''),
        'sslmode': 'require'
    }
    
    # Ler o arquivo de migração
    migration_file = '/tmp/easy-market/backend/src/migrations/008_add_customer_analytics.sql'
    
    try:
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        # Conectar ao banco
        print(f"Conectando ao banco de dados: {db_config['host']}")
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Executar a migração
        print("Executando migração 008_add_customer_analytics.sql...")
        cursor.execute(migration_sql)
        conn.commit()
        
        print("✓ Migração aplicada com sucesso!")
        
        # Verificar se a tabela foi criada
        cursor.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='clientes');")
        exists = cursor.fetchone()[0]
        
        if exists:
            print("✓ Tabela 'clientes' criada com sucesso!")
        else:
            print("✗ Erro: tabela 'clientes' não foi criada")
        
        cursor.close()
        conn.close()
        
    except FileNotFoundError:
        print(f"✗ Erro: arquivo de migração não encontrado: {migration_file}")
    except psycopg2.Error as e:
        print(f"✗ Erro ao conectar ou executar migração: {e}")
    except Exception as e:
        print(f"✗ Erro inesperado: {e}")

if __name__ == '__main__':
    apply_migration()
