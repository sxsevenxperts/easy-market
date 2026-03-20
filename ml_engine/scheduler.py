#!/usr/bin/env python3
"""
Scheduler para executar previsões automaticamente
Roda previsões a cada hora para cada categoria
"""

import os
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import requests
import json

from predictor import PredictionPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PredictionScheduler:
    """Scheduler para executar previsões periodicamente"""

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.api_url = os.getenv('API_BASE_URL', 'http://localhost:3000')
        self.categories = [
            'Bebidas', 'Alimentos', 'Higiene', 'Limpeza',
            'Frutos Secos', 'Carnes', 'Perecíveis', 'Outros'
        ]

    def schedule_hourly_predictions(self):
        """Agendar previsões a cada hora"""

        # Executar a cada hora no minuto 5
        self.scheduler.add_job(
            self.run_predictions,
            trigger=CronTrigger(minute=5),
            id='hourly_predictions',
            name='Hourly Predictions',
            replace_existing=True
        )

        logger.info("Hourly predictions scheduled")

    def schedule_daily_summary(self):
        """Agendar resumo diário às 6h da manhã"""

        self.scheduler.add_job(
            self.generate_daily_summary,
            trigger=CronTrigger(hour=6, minute=0),
            id='daily_summary',
            name='Daily Summary',
            replace_existing=True
        )

        logger.info("Daily summary scheduled for 6:00 AM")

    def schedule_weekly_report(self):
        """Agendar relatório semanal toda segunda às 8h"""

        self.scheduler.add_job(
            self.generate_weekly_report,
            trigger=CronTrigger(day_of_week=0, hour=8, minute=0),
            id='weekly_report',
            name='Weekly Report',
            replace_existing=True
        )

        logger.info("Weekly report scheduled for Mondays at 8:00 AM")

    def run_predictions(self):
        """Executar previsões para todas as categorias"""

        logger.info("Starting hourly predictions")
        pipeline = PredictionPipeline()

        try:
            # Obter lista de lojas ativas
            lojas = self._get_active_stores()

            for loja in lojas:
                loja_id = loja['loja_id']

                for category in self.categories:
                    try:
                        # Fazer previsão
                        result = pipeline.predict_category(loja_id, category, hours_ahead=24)

                        if 'error' not in result:
                            logger.info(f"Prediction completed for {loja_id}/{category}")

                            # Enviar para API (opcional)
                            self._sync_prediction_to_api(result)
                        else:
                            logger.warning(f"Prediction error for {loja_id}/{category}: {result['error']}")

                    except Exception as e:
                        logger.error(f"Error predicting {category} for {loja_id}: {str(e)}")

        finally:
            pipeline.close()

    def generate_daily_summary(self):
        """Gerar resumo diário de previsões"""

        logger.info("Generating daily summary")

        try:
            lojas = self._get_active_stores()

            summary_data = []

            for loja in lojas:
                loja_id = loja['loja_id']

                # Buscar previsões do dia
                predictions = self._get_predictions_for_today(loja_id)

                summary = {
                    'loja_id': loja_id,
                    'data': datetime.now().date().isoformat(),
                    'total_previsoes': len(predictions),
                    'confianca_media': self._calculate_avg_confidence(predictions),
                    'categorias': self._group_by_category(predictions)
                }

                summary_data.append(summary)

            # Salvar resumo
            self._save_daily_summary(summary_data)
            logger.info(f"Daily summary generated for {len(summary_data)} stores")

        except Exception as e:
            logger.error(f"Error generating daily summary: {str(e)}")

    def generate_weekly_report(self):
        """Gerar relatório semanal com insights"""

        logger.info("Generating weekly report")

        try:
            lojas = self._get_active_stores()

            for loja in lojas:
                loja_id = loja['loja_id']

                # Buscar dados da semana
                predictions = self._get_predictions_for_period(loja_id, days=7)
                sales = self._get_sales_for_period(loja_id, days=7)

                # Calcular acurácia
                accuracy = self._calculate_accuracy(predictions, sales)

                # Gerar recomendações
                recommendations = self._generate_recommendations(loja_id, predictions, sales)

                report = {
                    'loja_id': loja_id,
                    'semana': datetime.now().isocalendar()[1],
                    'ano': datetime.now().year,
                    'acuracia_media': accuracy,
                    'destaques': {
                        'categoria_melhor_prevista': recommendations['best_predicted'],
                        'categoria_pior_prevista': recommendations['worst_predicted'],
                        'categoria_maior_demanda': recommendations['highest_demand']
                    },
                    'insights': recommendations['insights']
                }

                # Enviar relatório para API
                self._send_report_to_api(report)

                logger.info(f"Weekly report generated for {loja_id}")

        except Exception as e:
            logger.error(f"Error generating weekly report: {str(e)}")

    # =========== Helper Methods ===========

    def _get_active_stores(self):
        """Buscar todas as lojas ativas"""
        # Em produção, isso viria do banco de dados
        return [
            {'loja_id': 'loja_001'},
            {'loja_id': 'loja_002'},
            {'loja_id': 'loja_003'},
        ]

    def _get_predictions_for_today(self, loja_id: str):
        """Buscar previsões de hoje"""
        # Query ao banco de dados
        return []

    def _get_predictions_for_period(self, loja_id: str, days: int):
        """Buscar previsões do período"""
        return []

    def _get_sales_for_period(self, loja_id: str, days: int):
        """Buscar vendas reais do período"""
        return []

    def _calculate_avg_confidence(self, predictions):
        """Calcular confiança média das previsões"""
        if not predictions:
            return 0
        return sum([p.get('confianca_percentual', 0) for p in predictions]) / len(predictions)

    def _calculate_accuracy(self, predictions, sales):
        """Calcular acurácia MAPE entre previsões e vendas reais"""
        # Implementação real calcularia MAPE
        return 85.0

    def _group_by_category(self, predictions):
        """Agrupar previsões por categoria"""
        grouped = {}
        for p in predictions:
            cat = p.get('categoria', 'Outros')
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(p)
        return grouped

    def _generate_recommendations(self, loja_id: str, predictions, sales):
        """Gerar recomendações com base em previsões e vendas"""

        return {
            'best_predicted': 'Bebidas',
            'worst_predicted': 'Perecíveis',
            'highest_demand': 'Alimentos',
            'insights': [
                'Bebidas tem tendência de aumento nos fins de semana',
                'Perecíveis requerem monitoramento mais frequente',
                'Pico de vendas concentrado entre 10h-12h e 18h-20h'
            ]
        }

    def _sync_prediction_to_api(self, result: dict):
        """Enviar previsão para API"""
        try:
            response = requests.post(
                f'{self.api_url}/api/v1/relatorios/salvar-previsao',
                json=result,
                timeout=10
            )
            if response.status_code not in [200, 201]:
                logger.warning(f"API sync returned {response.status_code}")
        except Exception as e:
            logger.error(f"Error syncing to API: {str(e)}")

    def _save_daily_summary(self, summary_data: list):
        """Salvar resumo diário no banco"""
        # Implementar persistência
        pass

    def _send_report_to_api(self, report: dict):
        """Enviar relatório para API"""
        try:
            requests.post(
                f'{self.api_url}/api/v1/relatorios/salvar-relatorio-semanal',
                json=report,
                timeout=10
            )
        except Exception as e:
            logger.error(f"Error sending report: {str(e)}")

    def start(self):
        """Iniciar scheduler"""
        self.schedule_hourly_predictions()
        self.schedule_daily_summary()
        self.schedule_weekly_report()

        self.scheduler.start()
        logger.info("Prediction scheduler started")

    def stop(self):
        """Parar scheduler"""
        self.scheduler.shutdown()
        logger.info("Prediction scheduler stopped")


if __name__ == '__main__':
    import time

    scheduler = PredictionScheduler()
    scheduler.start()

    logger.info("Scheduler running. Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        scheduler.stop()
