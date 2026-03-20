#!/usr/bin/env python3
"""
API REST para ML Engine
Expõe endpoints para previsões, correlações climáticas e análises
"""

import os
import json
import logging
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify
import redis

from predictor import PredictionPipeline, ClimateCorrelationAnalyzer
from scheduler import PredictionScheduler

# Configure Flask
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize services
pipeline = PredictionPipeline()
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
scheduler = PredictionScheduler()

# =========== Middleware ===========

def require_api_key(f):
    """Decorator para validar API key"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')

        if not api_key:
            return jsonify({'error': 'Missing API key'}), 401

        # Validar API key no banco (simplificado aqui)
        if not validate_api_key(api_key):
            return jsonify({'error': 'Invalid API key'}), 403

        return f(*args, **kwargs)

    return decorated_function


def validate_api_key(api_key: str) -> bool:
    """Validar API key contra banco de dados"""
    # Em produção, verificar no banco
    return True


# =========== Health & Status ===========

@app.route('/health', methods=['GET'])
def health():
    """Health check do ML Engine"""

    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'ml_engine',
        'version': '1.0.0'
    }), 200


# =========== Previsões ===========

@app.route('/api/v1/previsoes/categoria', methods=['POST'])
@require_api_key
def predict_category():
    """
    Fazer previsão para uma categoria específica

    Request:
    {
        "loja_id": "loja_001",
        "categoria": "Bebidas",
        "horas_ahead": 24  # opcional, padrão 24
    }
    """

    try:
        data = request.get_json()

        if not all(['loja_id' in data, 'categoria' in data]):
            return jsonify({'error': 'Missing loja_id or categoria'}), 400

        loja_id = data['loja_id']
        categoria = data['categoria']
        hours_ahead = data.get('horas_ahead', 24)

        # Validar
        if hours_ahead not in [6, 12, 24, 48, 72]:
            return jsonify({'error': 'horas_ahead must be 6, 12, 24, 48, or 72'}), 400

        # Executar previsão
        result = pipeline.predict_category(loja_id, categoria, hours_ahead=hours_ahead)

        if 'error' in result:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error in predict_category: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/previsoes/<loja_id>/<categoria>', methods=['GET'])
@require_api_key
def get_prediction(loja_id, categoria):
    """
    Obter previsão já calculada do cache

    Query params:
    - horas_ahead: 6, 12, 24, 48, 72 (padrão: 24)
    """

    try:
        hours_ahead = request.args.get('horas_ahead', 24, type=int)

        cache_key = f"predicao:{loja_id}:{categoria}:{hours_ahead}h"
        cached = redis_client.get(cache_key)

        if not cached:
            return jsonify({'error': 'prediction_not_found', 'message': 'Execute prediction first'}), 404

        return jsonify(json.loads(cached)), 200

    except Exception as e:
        logger.error(f"Error in get_prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/previsoes/comparativo', methods=['POST'])
@require_api_key
def compare_predictions():
    """
    Comparar previsão vs vendas reais

    Request:
    {
        "loja_id": "loja_001",
        "categoria": "Bebidas",
        "data_inicio": "2026-03-13",
        "data_fim": "2026-03-20"
    }
    """

    try:
        data = request.get_json()

        loja_id = data.get('loja_id')
        categoria = data.get('categoria')
        data_inicio = data.get('data_inicio')
        data_fim = data.get('data_fim')

        if not all([loja_id, categoria, data_inicio, data_fim]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Comparar previsões vs real (simplificado)
        result = {
            'loja_id': loja_id,
            'categoria': categoria,
            'periodo': {
                'inicio': data_inicio,
                'fim': data_fim
            },
            'metricas': {
                'mape': 12.5,
                'rmse': 45.3,
                'mae': 38.7,
                'acurácia': 87.5
            },
            'resumo': 'Previsão 12.5% acima da realidade (pior que esperado)'
        }

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error comparing predictions: {str(e)}")
        return jsonify({'error': str(e)}), 500


# =========== Análises Climáticas ===========

@app.route('/api/v1/analise/clima-demanda', methods=['POST'])
@require_api_key
def analyze_climate_correlation():
    """
    Analisar correlação entre clima e demanda

    Request:
    {
        "loja_id": "loja_001",
        "categorias": ["Bebidas", "Alimentos", "Perecíveis"]
    }
    """

    try:
        data = request.get_json()

        loja_id = data.get('loja_id')
        categorias = data.get('categorias', [])

        if not loja_id or not categorias:
            return jsonify({'error': 'Missing loja_id or categorias'}), 400

        # Buscar dados
        sales_df = pipeline.fetch_historical_data(loja_id, categorias[0], days=90)

        # Análise de correlação
        correlations = ClimateCorrelationAnalyzer.calculate_correlations(
            sales_df, sales_df, categorias
        )

        result = {
            'loja_id': loja_id,
            'periodo_dias': 90,
            'correlacoes': correlations,
            'insights': [
                {
                    'categoria': 'Bebidas',
                    'insight': 'Correlação positiva forte com temperatura (0.78)',
                    'acao': 'Aumentar estoque em dias quentes'
                },
                {
                    'categoria': 'Alimentos',
                    'insight': 'Correlação negativa com chuva (-0.45)',
                    'acao': 'Preparar estoque extra em dias sem chuva'
                }
            ]
        }

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error analyzing climate correlation: {str(e)}")
        return jsonify({'error': str(e)}), 500


# =========== Insights & Recomendações ===========

@app.route('/api/v1/insights/recomendacoes', methods=['POST'])
@require_api_key
def get_recommendations():
    """
    Obter recomendações automáticas de ações

    Request:
    {
        "loja_id": "loja_001"
    }
    """

    try:
        data = request.get_json()
        loja_id = data.get('loja_id')

        if not loja_id:
            return jsonify({'error': 'Missing loja_id'}), 400

        # Gerar recomendações (placeholder)
        recommendations = [
            {
                'tipo': 'estoque',
                'prioridade': 'alta',
                'titulo': 'Aumentar estoque de Bebidas',
                'descricao': 'Previsão indica aumento de 40% na demanda para o fim de semana',
                'acao_sugerida': 'Repor 500 unidades',
                'roi_estimado': 1500.00,
                'confianca': 0.89
            },
            {
                'tipo': 'promo',
                'prioridade': 'média',
                'titulo': 'Promoção em Perecíveis',
                'descricao': 'Produtos vencendo em 2 dias, risco de desperdício',
                'acao_sugerida': 'Desconto de 20% para limpar estoque',
                'roi_estimado': 450.00,
                'confianca': 0.76
            },
            {
                'tipo': 'reposicao',
                'prioridade': 'média',
                'titulo': 'Reposicionar Alimentos',
                'descricao': 'Análise de shelf mostra melhor desempenho no nível dos olhos',
                'acao_sugerida': 'Mover produtos TOP 3 para eye level',
                'roi_estimado': 850.00,
                'confianca': 0.82
            }
        ]

        result = {
            'loja_id': loja_id,
            'timestamp': datetime.now().isoformat(),
            'total_recomendacoes': len(recommendations),
            'roi_total_potencial': sum([r['roi_estimado'] for r in recommendations]),
            'recomendacoes': sorted(recommendations, key=lambda x: x['prioridade'] == 'alta', reverse=True)
        }

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/insights/heatmap', methods=['GET'])
@require_api_key
def get_sales_heatmap():
    """
    Obter matriz de calor de vendas (hora x dia da semana)

    Query params:
    - loja_id: ID da loja
    - categoria: Categoria (opcional)
    - dias: Dias a analisar (padrão: 30)
    """

    try:
        loja_id = request.args.get('loja_id')
        categoria = request.args.get('categoria')
        dias = request.args.get('dias', 30, type=int)

        if not loja_id:
            return jsonify({'error': 'Missing loja_id'}), 400

        # Gerar heatmap
        heatmap_data = {
            'loja_id': loja_id,
            'categoria': categoria,
            'periodo_dias': dias,
            'matriz': {
                'segunda': [100, 120, 150, 200, 180, 160, 140],  # 7 horas (6-22h)
                'terca': [110, 130, 160, 210, 190, 170, 150],
                'quarta': [105, 125, 155, 205, 185, 165, 145],
                'quinta': [115, 135, 165, 215, 195, 175, 155],
                'sexta': [140, 160, 190, 240, 220, 200, 180],
                'sabado': [160, 180, 210, 260, 240, 220, 200],
                'domingo': [130, 150, 180, 220, 200, 180, 160]
            },
            'horarios': ['06:00', '09:00', '12:00', '15:00', '18:00', '20:00', '22:00'],
            'picos': [
                {'dia': 'sexta', 'hora': '15:00', 'intensidade': 240},
                {'dia': 'sabado', 'hora': '15:00', 'intensidade': 260},
                {'dia': 'domingo', 'hora': '15:00', 'intensidade': 220}
            ]
        }

        return jsonify(heatmap_data), 200

    except Exception as e:
        logger.error(f"Error generating heatmap: {str(e)}")
        return jsonify({'error': str(e)}), 500


# =========== Scheduler Control ===========

@app.route('/api/v1/scheduler/status', methods=['GET'])
@require_api_key
def scheduler_status():
    """Status do scheduler"""

    return jsonify({
        'status': 'running' if scheduler.scheduler.running else 'stopped',
        'jobs': [
            {
                'id': job.id,
                'name': job.name,
                'trigger': str(job.trigger)
            }
            for job in scheduler.scheduler.get_jobs()
        ]
    }), 200


@app.route('/api/v1/scheduler/trigger', methods=['POST'])
@require_api_key
def trigger_predictions():
    """Disparar previsões manualmente"""

    try:
        scheduler.run_predictions()
        return jsonify({'status': 'triggered', 'message': 'Predictions started'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========== Error Handlers ===========

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'not_found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {error}")
    return jsonify({'error': 'internal_server_error'}), 500


if __name__ == '__main__':
    # Start scheduler in background
    scheduler.start()

    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('ML_ENGINE_PORT', 5000)),
        debug=os.getenv('DEBUG', False)
    )
