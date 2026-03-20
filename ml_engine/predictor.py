#!/usr/bin/env python3
"""
Easy Market ML Engine - Previsões e Análise Preditiva
Suporta: Prophet, XGBoost, ARIMA, Linear Regression (ensemble)
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import warnings

import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import joblib
from prophet import Prophet
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression

# Silence warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseConnection:
    """PostgreSQL Database Connection Manager"""

    def __init__(self):
        self.conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432),
            database=os.getenv('DB_NAME', 'easy_market'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', '')
        )

    def query(self, sql: str, params: tuple = None) -> List[Dict]:
        """Execute query and return results"""
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(sql, params or ())
        results = cursor.fetchall()
        cursor.close()
        return results

    def execute(self, sql: str, params: tuple = None) -> None:
        """Execute command without returning results"""
        cursor = self.conn.cursor()
        cursor.execute(sql, params or ())
        self.conn.commit()
        cursor.close()

    def close(self):
        self.conn.close()


class FeatureEngineer:
    """Engenharia de features para modelos ML"""

    @staticmethod
    def create_lag_features(df: pd.DataFrame, lags: List[int] = [1, 7, 30]) -> pd.DataFrame:
        """Cria features de lag (defasagem)"""
        for lag in lags:
            df[f'lag_{lag}'] = df['quantidade'].shift(lag)
        return df

    @staticmethod
    def create_rolling_features(df: pd.DataFrame, windows: List[int] = [7, 14, 30]) -> pd.DataFrame:
        """Cria features de média móvel"""
        for window in windows:
            df[f'rolling_mean_{window}'] = df['quantidade'].rolling(window).mean()
            df[f'rolling_std_{window}'] = df['quantidade'].rolling(window).std()
        return df

    @staticmethod
    def create_cyclical_features(df: pd.DataFrame) -> pd.DataFrame:
        """Cria features cíclicas (hora, dia da semana, mês)"""
        df['hour'] = df['time'].dt.hour
        df['day_of_week'] = df['time'].dt.dayofweek
        df['day_of_month'] = df['time'].dt.day
        df['month'] = df['time'].dt.month
        df['quarter'] = df['time'].dt.quarter

        # Encoding cíclico (seno/cosseno)
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

        return df

    @staticmethod
    def create_interaction_features(df: pd.DataFrame, climate_data: Optional[pd.DataFrame] = None) -> pd.DataFrame:
        """Cria features de interação (clima x tempo, preço x demanda)"""

        if climate_data is not None:
            # Interação: temperatura x dia da semana
            df['temp_x_day'] = df['temperatura'] * df['day_of_week']
            # Interação: precipitação x fim de semana
            df['precip_x_weekend'] = df['precipitacao'] * (df['day_of_week'].isin([5, 6]).astype(int))

        # Interação: preço x quantidade histórica
        if 'preco_unitario' in df.columns and 'lag_7' in df.columns:
            df['preco_x_lag7'] = df['preco_unitario'] * df['lag_7']

        return df


class ProphetPredictor:
    """Previsor usando Facebook Prophet"""

    def __init__(self, redis_client):
        self.redis = redis_client

    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepara dados para Prophet"""
        prophet_df = df[['time', 'quantidade']].copy()
        prophet_df.columns = ['ds', 'y']
        prophet_df['ds'] = pd.to_datetime(prophet_df['ds'])
        return prophet_df

    def train_and_predict(self, df: pd.DataFrame, periods: int = 24,
                         interval_width: float = 0.95) -> Tuple[pd.DataFrame, Dict]:
        """Treina modelo Prophet e retorna previsões"""
        try:
            prophet_df = self.prepare_data(df)

            # Treinar modelo
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=True,
                interval_width=interval_width,
                seasonality_mode='multiplicative'
            )

            model.fit(prophet_df)

            # Fazer previsões
            future = model.make_future_dataframe(periods=periods, freq='H')
            forecast = model.predict(future)

            # Extrair últimas previsões
            forecast_df = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
            forecast_df.columns = ['time', 'predicao', 'intervalo_inferior', 'intervalo_superior']

            # Métricas
            metrics = self._calculate_metrics(model, prophet_df)

            return forecast_df, metrics

        except Exception as e:
            logger.error(f"Prophet prediction error: {str(e)}")
            raise

    def _calculate_metrics(self, model, df: pd.DataFrame) -> Dict:
        """Calcula métricas de qualidade do modelo"""
        # MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((df['y'] - model.predict(df[['ds']])['yhat']) / df['y']))

        return {
            'mape': float(mape),
            'rmse': None,  # Calculated with cross-validation
            'model_type': 'prophet'
        }


class XGBoostPredictor:
    """Previssor usando XGBoost"""

    def __init__(self, redis_client):
        self.redis = redis_client
        self.scaler = StandardScaler()

    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepara features para XGBoost"""
        feature_cols = [
            'lag_1', 'lag_7', 'lag_30',
            'rolling_mean_7', 'rolling_mean_30',
            'hour_sin', 'hour_cos', 'day_sin', 'day_cos',
            'temperatura', 'umidade_relativa', 'precipitacao'
        ]

        # Remover NaN
        df_clean = df.dropna()

        X = df_clean[[col for col in feature_cols if col in df_clean.columns]]
        y = df_clean['quantidade']

        # Normalizar features
        X_scaled = self.scaler.fit_transform(X)

        return X_scaled, y.values

    def train_and_predict(self, X_train: np.ndarray, y_train: np.ndarray,
                         X_test: np.ndarray) -> Tuple[np.ndarray, Dict]:
        """Treina modelo XGBoost e faz previsões"""
        try:
            # Treinar modelo
            model = xgb.XGBRegressor(
                max_depth=7,
                learning_rate=0.1,
                n_estimators=200,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )

            model.fit(X_train, y_train, verbose=False)

            # Previsões
            predictions = model.predict(X_test)

            # Importância das features
            importance = dict(zip(
                model.feature_names_in_,
                model.feature_importances_
            ))

            metrics = {
                'model_type': 'xgboost',
                'feature_importance': importance
            }

            return predictions, metrics

        except Exception as e:
            logger.error(f"XGBoost prediction error: {str(e)}")
            raise


class EnsemblePredictor:
    """Combinação ponderada de múltiplos modelos"""

    def __init__(self, weights: Dict[str, float] = None):
        """
        weights: {'prophet': 0.4, 'xgboost': 0.4, 'linear': 0.2}
        """
        self.weights = weights or {
            'prophet': 0.4,
            'xgboost': 0.4,
            'linear': 0.2
        }

    def predict(self, predictions_dict: Dict[str, np.ndarray]) -> Tuple[np.ndarray, Dict]:
        """Combina previsões com pesos"""

        ensemble_pred = np.zeros_like(predictions_dict[list(predictions_dict.keys())[0]])

        for model_name, preds in predictions_dict.items():
            weight = self.weights.get(model_name, 0)
            ensemble_pred += weight * preds

        # Confidence score baseado na concordância dos modelos
        if len(predictions_dict) > 1:
            std_across_models = np.std([preds for preds in predictions_dict.values()], axis=0)
            confidence = 1 / (1 + std_across_models)
        else:
            confidence = np.ones_like(ensemble_pred) * 0.8

        metrics = {
            'model_type': 'ensemble',
            'weights': self.weights,
            'confidence_mean': float(np.mean(confidence))
        }

        return ensemble_pred, confidence, metrics


class ClimateCorrelationAnalyzer:
    """Analisa correlação entre clima e demanda"""

    @staticmethod
    def calculate_correlations(sales_df: pd.DataFrame, climate_df: pd.DataFrame,
                              categories: List[str]) -> Dict[str, Dict]:
        """Calcula correlação de Pearson entre clima e vendas por categoria"""

        # Merge dados
        merged_df = pd.merge_asof(
            sales_df.sort_values('time'),
            climate_df.sort_values('time'),
            on='time',
            direction='nearest'
        )

        correlations = {}

        for category in categories:
            cat_data = merged_df[merged_df['categoria'] == category]

            if len(cat_data) < 30:  # Mínimo de dados
                continue

            corr_dict = {}

            # Correlação com temperatura
            if 'temperatura' in cat_data.columns:
                corr_dict['temperatura'] = float(
                    cat_data['quantidade'].corr(cat_data['temperatura'])
                )

            # Correlação com precipitação
            if 'precipitacao' in cat_data.columns:
                corr_dict['precipitacao'] = float(
                    cat_data['quantidade'].corr(cat_data['precipitacao'])
                )

            # Correlação com umidade
            if 'umidade_relativa' in cat_data.columns:
                corr_dict['umidade'] = float(
                    cat_data['quantidade'].corr(cat_data['umidade_relativa'])
                )

            correlations[category] = corr_dict

        return correlations


class PredictionPipeline:
    """Pipeline completo de previsão"""

    def __init__(self):
        self.db = DatabaseConnection()
        self.redis = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.feature_engineer = FeatureEngineer()
        self.climate_analyzer = ClimateCorrelationAnalyzer()

    def fetch_historical_data(self, loja_id: str, categoria: str, days: int = 90) -> pd.DataFrame:
        """Busca dados históricos de vendas"""

        sql = """
            SELECT
                time, quantidade, preco_unitario, categoria,
                temperatura, umidade_relativa, precipitacao,
                is_feriado, evento_local
            FROM vendas
            WHERE loja_id = %s
            AND categoria = %s
            AND time >= NOW() - INTERVAL '%s days'
            ORDER BY time ASC
        """

        results = self.db.query(sql, (loja_id, categoria, days))

        df = pd.DataFrame(results)
        df['time'] = pd.to_datetime(df['time'])

        # Resample para horário (agregar por hora)
        df = df.set_index('time').resample('1H')['quantidade'].sum().reset_index()

        return df

    def predict_category(self, loja_id: str, categoria: str,
                        hours_ahead: int = 24) -> Dict:
        """Previsão completa para uma categoria"""

        logger.info(f"Predicting {categoria} for {loja_id} - {hours_ahead}h ahead")

        # Verificar cache
        cache_key = f"predicao:{loja_id}:{categoria}:{hours_ahead}h"
        cached = self.redis.get(cache_key)
        if cached:
            logger.info(f"Cache hit for {cache_key}")
            return json.loads(cached)

        try:
            # Buscar dados históricos
            df = self.fetch_historical_data(loja_id, categoria)

            if len(df) < 30:
                logger.warning(f"Insufficient data for {categoria}")
                return {'error': 'insufficient_data', 'min_required': 30, 'available': len(df)}

            # Feature engineering
            df = self.feature_engineer.create_lag_features(df)
            df = self.feature_engineer.create_rolling_features(df)
            df = self.feature_engineer.create_cyclical_features(df)

            # Prophet
            prophet_predictor = ProphetPredictor(self.redis)
            prophet_forecast, prophet_metrics = prophet_predictor.train_and_predict(
                df, periods=hours_ahead
            )

            # XGBoost
            xgb_predictor = XGBoostPredictor(self.redis)
            X_train, y_train = xgb_predictor.prepare_features(df[:-hours_ahead])
            X_test, _ = xgb_predictor.prepare_features(df[-hours_ahead:])
            xgb_preds, xgb_metrics = xgb_predictor.train_and_predict(X_train, y_train, X_test)

            # Ensemble
            ensemble = EnsemblePredictor()
            predictions_dict = {
                'prophet': prophet_forecast['predicao'].values,
                'xgboost': xgb_preds
            }
            ensemble_preds, confidence, ensemble_metrics = ensemble.predict(predictions_dict)

            # Resultado final
            result = {
                'loja_id': loja_id,
                'categoria': categoria,
                'periodo_horas': hours_ahead,
                'timestamp': datetime.now().isoformat(),
                'previsoes': [
                    {
                        'hora': i + 1,
                        'quantidade_esperada': float(ensemble_preds[i]),
                        'intervalo_confianca': [
                            float(prophet_forecast['intervalo_inferior'].iloc[i]),
                            float(prophet_forecast['intervalo_superior'].iloc[i])
                        ],
                        'confianca_percentual': float(confidence[i] * 100),
                        'modelos': {
                            'prophet': float(prophet_forecast['predicao'].iloc[i]),
                            'xgboost': float(xgb_preds[i])
                        }
                    }
                    for i in range(hours_ahead)
                ],
                'metricas': {
                    **prophet_metrics,
                    **xgb_metrics,
                    **ensemble_metrics
                }
            }

            # Salvar no banco
            self._save_prediction(result)

            # Cache por 30 minutos
            self.redis.setex(cache_key, 1800, json.dumps(result, default=str))

            return result

        except Exception as e:
            logger.error(f"Prediction error for {categoria}: {str(e)}")
            return {'error': str(e)}

    def _save_prediction(self, result: Dict) -> None:
        """Salva previsão no banco de dados"""

        try:
            for previsao in result['previsoes']:
                sql = """
                    INSERT INTO previsoes (
                        loja_id, categoria, data_inicio, data_fim,
                        modelo, quantidade_esperada,
                        quantidade_lower, quantidade_upper,
                        confianca_percentual, accuracy_mape
                    ) VALUES (%s, %s, NOW(), NOW() + INTERVAL '1 hour',
                              %s, %s, %s, %s, %s, %s)
                """

                params = (
                    result['loja_id'],
                    result['categoria'],
                    'ensemble',
                    previsao['quantidade_esperada'],
                    previsao['intervalo_confianca'][0],
                    previsao['intervalo_confianca'][1],
                    previsao['confianca_percentual'],
                    result['metricas'].get('mape')
                )

                self.db.execute(sql, params)

        except Exception as e:
            logger.error(f"Error saving prediction: {str(e)}")

    def close(self):
        self.db.close()


if __name__ == '__main__':
    pipeline = PredictionPipeline()

    # Exemplo de uso
    result = pipeline.predict_category('loja_001', 'Bebidas', hours_ahead=24)
    print(json.dumps(result, indent=2, default=str))

    pipeline.close()
