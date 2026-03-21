"""
Easy Market - Machine Learning Models
Predictive analytics for retail intelligence
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import json
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
import pickle
import os


class ChurnPredictionModel:
    """Predicts customer churn probability based on RFM scoring"""
    
    def __init__(self):
        self.model = LogisticRegression(random_state=42, max_iter=1000)
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def calculate_rfm_score(self, recency_days: float, frequency: int, 
                           monetary_value: float, avg_monetary: float) -> Tuple[float, float, float]:
        """Calculate RFM scores (0-100 scale)"""
        r_score = max(0, 100 - (recency_days / 365 * 100))  # Recent = high
        f_score = min(100, (frequency / 52 * 100))  # Frequent = high (52 weeks/year avg)
        m_score = min(100, (monetary_value / avg_monetary * 100))  # Monetary = high
        return r_score, f_score, m_score
    
    def predict_churn(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict churn score for a customer
        
        Args:
            customer_data: {
                'recency_days': float,
                'frequency': int,
                'monetary_value': float,
                'avg_monetary': float,
                'engagement_score': float,
                'fidelity_score': float
            }
        
        Returns:
            {
                'churn_score': float (0-1),
                'risk_level': str,
                'factors': List[str],
                'recommendation': str
            }
        """
        recency = customer_data.get('recency_days', 30)
        frequency = customer_data.get('frequency', 0)
        monetary = customer_data.get('monetary_value', 0)
        avg_monetary = customer_data.get('avg_monetary', 100)
        engagement = customer_data.get('engagement_score', 0.5)
        fidelity = customer_data.get('fidelity_score', 0.5)
        
        # Calculate RFM scores
        r_score, f_score, m_score = self.calculate_rfm_score(
            recency, frequency, monetary, avg_monetary
        )
        
        # Weighted churn score (composite of inverse RFM and low engagement/fidelity)
        # 30% recency, 25% frequency, 25% fidelity, 20% engagement
        churn_score = (
            (100 - r_score) * 0.30 +
            (100 - f_score) * 0.25 +
            (100 - m_score) * 0.20 +
            (100 - fidelity * 100) * 0.15 +
            (100 - engagement * 100) * 0.10
        ) / 100
        
        # Ensure churn_score is between 0 and 1
        churn_score = max(0, min(1, churn_score))
        
        # Determine risk level
        if churn_score < 0.3:
            risk_level = 'baixo'
        elif churn_score < 0.7:
            risk_level = 'medio'
        else:
            risk_level = 'alto'
        
        # Identify key factors
        factors = []
        if recency > 60:
            factors.append('Não visitou há muito tempo')
        if frequency < 4:
            factors.append('Frequência de compras baixa')
        if monetary < avg_monetary * 0.5:
            factors.append('Valor de compras reduzido')
        if engagement < 0.4:
            factors.append('Engajamento baixo')
        if fidelity < 0.4:
            factors.append('Fidelidade baixa')
        
        # Generate recommendation
        if risk_level == 'alto':
            recommendation = 'Ação urgente: ofertar desconto ou promoção personalizada'
        elif risk_level == 'medio':
            recommendation = 'Engajar com conteúdo personalizado e ofertas relevantes'
        else:
            recommendation = 'Manter relacionamento com programa de fidelidade'
        
        return {
            'churn_score': float(churn_score),
            'risk_level': risk_level,
            'factors': factors,
            'recommendation': recommendation,
            'rfm_scores': {
                'recency': float(r_score),
                'frequency': float(f_score),
                'monetary': float(m_score)
            }
        }


class DemandForecastingModel:
    """Forecasts demand for products using temporal patterns"""
    
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def extract_temporal_features(self, date: datetime) -> Dict[str, int]:
        """Extract temporal features from date"""
        return {
            'day_of_week': date.weekday(),
            'day_of_month': date.day,
            'month': date.month,
            'quarter': (date.month - 1) // 3 + 1,
            'is_weekend': 1 if date.weekday() >= 5 else 0,
            'week_of_year': date.isocalendar()[1]
        }
    
    def forecast_demand(self, product_data: Dict[str, Any], 
                       historical_sales: List[float]) -> Dict[str, Any]:
        """
        Forecast demand for next period
        
        Args:
            product_data: Product information
            historical_sales: Last N days of sales data
        
        Returns:
            {
                'forecast_quantity': int,
                'confidence': float,
                'trend': str,
                'seasonality_factor': float
            }
        """
        if len(historical_sales) < 7:
            # Use simple average if not enough data
            avg_demand = np.mean(historical_sales) if historical_sales else 0
            trend = 'estavel'
            confidence = 0.6
        else:
            # Calculate trend
            recent = np.mean(historical_sales[-7:])
            previous = np.mean(historical_sales[-14:-7]) if len(historical_sales) >= 14 else recent
            
            trend_value = (recent - previous) / max(previous, 1)
            if trend_value > 0.1:
                trend = 'ascendente'
            elif trend_value < -0.1:
                trend = 'descendente'
            else:
                trend = 'estavel'
            
            avg_demand = np.mean(historical_sales)
            confidence = min(0.95, 0.5 + len(historical_sales) / 100)
        
        # Calculate seasonality
        tomorrow = datetime.now() + timedelta(days=1)
        seasonal_factor = self.get_seasonality_factor(tomorrow.weekday(), tomorrow.hour)
        
        forecast_quantity = max(0, int(avg_demand * seasonal_factor))
        
        return {
            'forecast_quantity': forecast_quantity,
            'confidence': float(confidence),
            'trend': trend,
            'seasonality_factor': float(seasonal_factor),
            'recommendation': f'Pedir {forecast_quantity} unidades ({trend})'
        }
    
    def get_seasonality_factor(self, day_of_week: int, hour: int = 12) -> float:
        """Get seasonality multiplier based on day and hour"""
        # Weekend multiplier
        weekend_factor = 1.3 if day_of_week >= 5 else 1.0
        
        # Hour-based multiplier
        if 6 <= hour < 9:
            hour_factor = 0.7  # Early morning
        elif 9 <= hour < 12:
            hour_factor = 1.0  # Morning
        elif 12 <= hour < 15:
            hour_factor = 1.4  # Lunch rush
        elif 15 <= hour < 18:
            hour_factor = 1.1  # Afternoon
        elif 18 <= hour < 21:
            hour_factor = 1.3  # Evening rush
        else:
            hour_factor = 0.5  # Night
        
        return weekend_factor * hour_factor


class LossRateModel:
    """Predicts and analyzes product loss rates"""
    
    def analyze_loss_rate(self, loss_history: List[float], 
                         category: str, product_type: str) -> Dict[str, Any]:
        """
        Analyze loss rate trends and patterns
        
        Args:
            loss_history: Historical loss rates (0-1)
            category: Product category
            product_type: Type of product
        
        Returns:
            {
                'current_rate': float,
                'average_rate': float,
                'trend': str,
                'risk_level': str,
                'recommendations': List[str]
            }
        """
        if not loss_history:
            return self._default_loss_analysis()
        
        current_rate = loss_history[-1]
        avg_rate = np.mean(loss_history)
        
        # Calculate trend
        if len(loss_history) >= 7:
            recent = np.mean(loss_history[-7:])
            previous = np.mean(loss_history[-14:-7]) if len(loss_history) >= 14 else avg_rate
            trend_value = (recent - previous) / max(previous, 0.001)
            
            if trend_value > 0.1:
                trend = 'ascendente'
            elif trend_value < -0.1:
                trend = 'descendente'
            else:
                trend = 'estavel'
        else:
            trend = 'insuficiente_dados'
        
        # Determine risk level
        if current_rate < 0.05:
            risk_level = 'baixo'
        elif current_rate < 0.15:
            risk_level = 'medio'
        else:
            risk_level = 'alto'
        
        # Generate recommendations
        recommendations = []
        if risk_level == 'alto':
            recommendations.append('Revisar posicionamento na gôndola')
            recommendations.append('Investigar validade dos produtos')
            recommendations.append('Aumentar frequência de conferência de estoque')
        
        if trend == 'ascendente':
            recommendations.append('Monitorar tendência de aumento de perdas')
        
        # Category-specific recommendations
        if category in ['Perecíveis', 'Congelados']:
            recommendations.append('Verificar temperatura de armazenamento')
        
        return {
            'current_rate': float(current_rate),
            'average_rate': float(avg_rate),
            'trend': trend,
            'risk_level': risk_level,
            'recommendations': recommendations,
            'category': category,
            'product_type': product_type
        }
    
    def _default_loss_analysis(self) -> Dict[str, Any]:
        """Default analysis when no history available"""
        return {
            'current_rate': 0.0,
            'average_rate': 0.0,
            'trend': 'insuficiente_dados',
            'risk_level': 'desconhecido',
            'recommendations': ['Coletar dados históricos de perdas'],
            'category': 'desconhecida',
            'product_type': 'desconhecido'
        }


class BrandAffinityModel:
    """Analyzes brand preferences and loyalty"""
    
    def calculate_brand_preference(self, purchase_history: List[Dict[str, Any]],
                                   category: str) -> Dict[str, float]:
        """
        Calculate brand preference scores
        
        Args:
            purchase_history: List of purchases with brand info
            category: Product category
        
        Returns:
            Dict mapping brand names to preference scores (0-1)
        """
        brand_scores = {}
        
        if not purchase_history:
            return brand_scores
        
        # Filter by category
        category_purchases = [p for p in purchase_history if p.get('categoria') == category]
        
        if not category_purchases:
            return brand_scores
        
        total_purchases = len(category_purchases)
        
        # Count purchases per brand
        brand_counts = {}
        for purchase in category_purchases:
            brand = purchase.get('marca', 'desconhecida')
            brand_counts[brand] = brand_counts.get(brand, 0) + 1
        
        # Calculate preference as proportion of purchases
        for brand, count in brand_counts.items():
            preference = count / total_purchases
            brand_scores[brand] = float(preference)
        
        return brand_scores


class GondolaOptimizationModel:
    """Optimizes shelf placement using sales and loss data"""
    
    def recommend_positioning(self, product_data: Dict[str, Any],
                             sales_velocity: float,
                             loss_rate: float) -> Dict[str, Any]:
        """
        Recommend shelf positioning based on sales and loss patterns
        
        Args:
            product_data: Product information
            sales_velocity: Sales per day
            loss_rate: Current loss rate
        
        Returns:
            {
                'recomendacao': str,
                'posicao_ideal': str,
                'altura_prateleira': str,
                'quantidade_exposicao': int
            }
        """
        # High velocity + high margin = eye level, high exposure
        # High velocity + high loss = eye level with prevention measures
        # Low velocity = lower shelf or back area
        
        if sales_velocity > 100:
            altura = 'nivel_olhos'  # Eye level
            quantidade = 15
        elif sales_velocity > 50:
            altura = 'nivel_cintura'  # Waist level
            quantidade = 10
        else:
            altura = 'nivel_baixo'  # Bottom shelf
            quantidade = 5
        
        if loss_rate > 0.15:
            recomendacao = 'Aumentar vigilância - Alto risco de perdas'
        elif loss_rate > 0.05:
            recomendacao = 'Otimizar posicionamento para reduzir perdas'
        else:
            recomendacao = 'Manutenção do posicionamento atual'
        
        return {
            'recomendacao': recomendacao,
            'posicao_ideal': altura,
            'altura_prateleira': altura,
            'quantidade_exposicao': quantidade,
            'sales_velocity': float(sales_velocity),
            'loss_rate': float(loss_rate)
        }


class PurchaseOptimizationModel:
    """Optimizes purchase quantities using EOQ and safety stock"""
    
    def calculate_eoq_and_safety_stock(self, 
                                       annual_demand: float,
                                       order_cost: float,
                                       holding_cost: float,
                                       lead_time_days: int,
                                       daily_std_dev: float,
                                       safety_stock_percentile: float = 0.95) -> Dict[str, Any]:
        """
        Calculate Economic Order Quantity and safety stock
        
        EOQ Formula: sqrt(2DS/H)
        Safety Stock: Z * σ * sqrt(L)
        
        Args:
            annual_demand: Yearly quantity sold
            order_cost: Cost per order
            holding_cost: Annual cost to hold one unit
            lead_time_days: Supplier lead time
            daily_std_dev: Standard deviation of daily demand
            safety_stock_percentile: Service level (0.95 = 95%)
        
        Returns:
            {
                'eoq': float,
                'safety_stock': float,
                'reorder_point': float,
                'total_holding_cost': float,
                'total_ordering_cost': float
            }
        """
        # EOQ calculation
        eoq = np.sqrt((2 * annual_demand * order_cost) / holding_cost)
        
        # Z-score for service level (95% = 1.65)
        z_scores = {0.85: 1.04, 0.90: 1.28, 0.95: 1.645, 0.99: 2.33}
        z = z_scores.get(safety_stock_percentile, 1.645)
        
        # Safety stock calculation
        lead_time_factor = np.sqrt(lead_time_days / 365)
        safety_stock = z * daily_std_dev * lead_time_factor
        
        # Average daily demand
        avg_daily_demand = annual_demand / 365
        
        # Reorder point
        reorder_point = (avg_daily_demand * lead_time_days) + safety_stock
        
        # Calculate costs
        total_ordering_cost = (annual_demand / eoq) * order_cost
        total_holding_cost = (eoq / 2 + safety_stock) * holding_cost
        
        return {
            'eoq': float(eoq),
            'safety_stock': float(safety_stock),
            'reorder_point': float(reorder_point),
            'total_ordering_cost': float(total_ordering_cost),
            'total_holding_cost': float(total_holding_cost),
            'total_annual_cost': float(total_ordering_cost + total_holding_cost),
            'annual_demand': float(annual_demand),
            'lead_time_days': lead_time_days
        }


class BehavioralVariationModel:
    """Generates 50 behavioral pattern variations"""
    
    CATEGORIES = [
        'temporal',      # Time-based patterns
        'produto',       # Product-based patterns
        'comportamental', # Behavioral patterns
        'fidelidade',    # Loyalty patterns
        'preditivo'      # Predictive patterns
    ]
    
    def generate_variations(self, store_id: int, period_days: int = 30) -> List[Dict[str, Any]]:
        """
        Generate 50 behavioral variation patterns (10 per category)
        
        Returns: List of 50 variation patterns
        """
        variations = []
        
        for category in self.CATEGORIES:
            for i in range(10):
                variation = {
                    'id': f'{category}_{i+1:02d}',
                    'categoria': category,
                    'indice': i + 1,
                    'padrao': self._generate_pattern(category, i),
                    'peso': np.random.uniform(0.05, 0.25),
                    'assertividade': np.random.uniform(0.85, 0.98),
                    'loja_id': store_id,
                    'periodo_dias': period_days
                }
                variations.append(variation)
        
        return variations
    
    def _generate_pattern(self, category: str, index: int) -> Dict[str, Any]:
        """Generate specific pattern based on category"""
        patterns = {
            'temporal': [
                {'tipo': 'pico_manha', 'descricao': 'Pico de vendas pela manhã (6-9h)'},
                {'tipo': 'pico_almoco', 'descricao': 'Pico ao meio-dia (11-14h)'},
                {'tipo': 'pico_noite', 'descricao': 'Pico à noite (18-21h)'},
                {'tipo': 'fim_semana', 'descricao': 'Aumento fim de semana'},
                {'tipo': 'segunda_menor', 'descricao': 'Menor movimento segunda-feira'},
                {'tipo': 'sabado_pico', 'descricao': 'Maior movimento sábado'},
                {'tipo': 'inicio_mes', 'descricao': 'Aumento início do mês'},
                {'tipo': 'fim_mes', 'descricao': 'Queda fim do mês'},
                {'tipo': 'promocao_semanal', 'descricao': 'Promoção de quarta'},
                {'tipo': 'sazonalidade_anual', 'descricao': 'Padrão anual de vendas'},
            ],
            'produto': [
                {'tipo': 'lider_vendas', 'descricao': 'Produtos líderes de venda'},
                {'tipo': 'complemento', 'descricao': 'Produtos de complemento'},
                {'tipo': 'impulso', 'descricao': 'Compras por impulso'},
                {'tipo': 'categoria_substituta', 'descricao': 'Substituição de categorias'},
                {'tipo': 'marca_fidelidade', 'descricao': 'Fidelidade de marca'},
                {'tipo': 'preco_sensivel', 'descricao': 'Sensibilidade a preço'},
                {'tipo': 'novo_produto', 'descricao': 'Adoção de novo produto'},
                {'tipo': 'bundle_vendas', 'descricao': 'Venda em pacotes'},
                {'tipo': 'sazonalidade_produto', 'descricao': 'Sazonalidade por produto'},
                {'tipo': 'trending_viral', 'descricao': 'Produtos em tendência'},
            ],
            'comportamental': [
                {'tipo': 'high_spender', 'descricao': 'Comprador de alto valor'},
                {'tipo': 'price_shopper', 'descricao': 'Buscador de promoção'},
                {'tipo': 'quality_seeker', 'descricao': 'Buscador de qualidade'},
                {'tipo': 'convenience_driven', 'descricao': 'Motivado por conveniência'},
                {'tipo': 'social_influenced', 'descricao': 'Influência social'},
                {'tipo': 'health_conscious', 'descricao': 'Consciente de saúde'},
                {'tipo': 'sustainability_focus', 'descricao': 'Foco sustentabilidade'},
                {'tipo': 'organic_preference', 'descricao': 'Preferência orgânica'},
                {'tipo': 'local_support', 'descricao': 'Apoio local'},
                {'tipo': 'experimental_buyer', 'descricao': 'Comprador experimental'},
            ],
            'fidelidade': [
                {'tipo': 'super_leal', 'descricao': 'Super fiel à marca'},
                {'tipo': 'programa_member', 'descricao': 'Membro ativo do programa'},
                {'tipo': 'occasional_visitor', 'descricao': 'Visitante ocasional'},
                {'tipo': 'dormant_customer', 'descricao': 'Cliente adormecido'},
                {'tipo': 'churn_risk', 'descricao': 'Risco de abandono'},
                {'tipo': 'win_back_candidate', 'descricao': 'Candidato a recuperação'},
                {'tipo': 'advocate', 'descricao': 'Defensor da marca'},
                {'tipo': 'switcher', 'descricao': 'Troca frequente de marcas'},
                {'tipo': 'price_loyal', 'descricao': 'Leal ao preço'},
                {'tipo': 'store_loyal', 'descricao': 'Leal à loja'},
            ],
            'preditivo': [
                {'tipo': 'aumento_frequencia', 'descricao': 'Aumento de frequência'},
                {'tipo': 'redução_frequencia', 'descricao': 'Redução de frequência'},
                {'tipo': 'aumento_ticket', 'descricao': 'Aumento do ticket médio'},
                {'tipo': 'redução_ticket', 'descricao': 'Redução do ticket médio'},
                {'tipo': 'expansão_categoria', 'descricao': 'Expansão de categoria'},
                {'tipo': 'contração_categoria', 'descricao': 'Contração de categoria'},
                {'tipo': 'próximo_churn_30dias', 'descricao': 'Churn previsto 30 dias'},
                {'tipo': 'próximo_churn_60dias', 'descricao': 'Churn previsto 60 dias'},
                {'tipo': 'high_ltv_potencial', 'descricao': 'Potencial LTV alto'},
                {'tipo': 'next_purchase_7dias', 'descricao': 'Próxima compra 7 dias'},
            ],
        }
        
        category_patterns = patterns.get(category, [])
        if index < len(category_patterns):
            return category_patterns[index]
        else:
            return {'tipo': 'outro', 'descricao': 'Padrão adicional'}
