#!/usr/bin/env python3

"""
Setup das tabelas do Supabase
Conecta direto ao PostgreSQL e executa o SQL
"""

import os
import psycopg2
from psycopg2 import sql

# Credenciais do Supabase (PostgreSQL Connection)
SUPABASE_HOST = "qfkwqfrnemqregjqxkcr.supabase.co"
SUPABASE_DB = "postgres"
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD', 'sua_senha_aqui')
SUPABASE_PORT = 5432

def read_sql_file(filename):
    """Ler arquivo SQL"""
    with open(filename, 'r', encoding='utf-8') as f:
        return f.read()

def split_statements(sql_content):
    """Dividir SQL em statements"""
    # Remover comentários e dividir por ;
    statements = []
    current = ""

    for line in sql_content.split('\n'):
        # Ignorar comentários
        if line.strip().startswith('--'):
            continue
        current += line + '\n'

        # Se linha termina com ;, é fim de statement
        if line.strip().endswith(';'):
            stmt = current.strip()
            if stmt:
                statements.append(stmt)
            current = ""

    return statements

def execute_sql():
    """Executar SQL no Supabase"""
    try:
        print("🚀 Conectando ao Supabase PostgreSQL...")

        # Conexão
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            port=SUPABASE_PORT,
            sslmode='require'
        )

        cursor = conn.cursor()
        print("✅ Conectado!\n")

        # Ler arquivo SQL
        print("📄 Lendo SUPABASE_SCHEMA_COMPLETO.sql...")
        sql_content = read_sql_file('SUPABASE_SCHEMA_COMPLETO.sql')

        # Dividir em statements
        statements = split_statements(sql_content)
        print(f"📊 {len(statements)} statements encontrados\n")

        # Executar cada statement
        for i, statement in enumerate(statements, 1):
            try:
                print(f"[{i}/{len(statements)}] Executando...", end=" ")
                cursor.execute(statement)
                conn.commit()
                print("✅")
            except psycopg2.Error as e:
                print(f"⚠️  {str(e)[:80]}...")
                conn.rollback()

        cursor.close()
        conn.close()

        print("\n" + "="*50)
        print("🎉 TABELAS CRIADAS COM SUCESSO!")
        print("="*50)
        print("\n✅ Próximo passo: Gerar dados fictícios")
        print("   npm run db:seed:year")

    except Exception as e:
        print(f"\n❌ Erro: {str(e)}")
        print("\n⚠️  SOLUÇÃO: Você precisa fornecer a senha do Supabase")
        print("\nOpciones:")
        print("1. Via variável de ambiente:")
        print("   export SUPABASE_PASSWORD='sua_senha'")
        print("   python3 scripts/setup-supabase-tables.py")
        print("\n2. Via arquivo .env:")
        print("   SUPABASE_PASSWORD=sua_senha")
        print("\n3. Via SQL Editor manualmente:")
        print("   https://qfkwqfrnemqregjqxkcr.supabase.co/project/default/sql/new")
        return False

    return True

if __name__ == '__main__':
    import sys

    # Verificar se psycopg2 está instalado
    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 não está instalado")
        print("\nInstale com:")
        print("  pip install psycopg2-binary")
        sys.exit(1)

    # Verificar se arquivo SQL existe
    if not os.path.exists('SUPABASE_SCHEMA_COMPLETO.sql'):
        print("❌ Arquivo SUPABASE_SCHEMA_COMPLETO.sql não encontrado")
        sys.exit(1)

    # Executar
    success = execute_sql()
    sys.exit(0 if success else 1)
