"""
Módulo de predicción de demostración para cuando el modelo real no está disponible.
"""

import random
import math

class DemoPredictor:
    """
    Clase que simula predicciones para demostración cuando no hay modelo disponible.
    Utiliza fórmulas aproximadas basadas en datos típicos de crecimiento de agave.
    """
    
    def __init__(self):
        """
        Inicializa el predictor de demostración.
        """
        self.is_demo = True
        print("Inicializando predictor de demostración (sin modelo ML real)")
    
    def predict(self, altura, diametro, hojas):
        """
        Realiza una predicción simulada del tiempo de crecimiento del agave.
        
        La fórmula aproximada está basada en las relaciones típicas entre:
        - Altura: mayor altura generalmente indica mayor edad
        - Diámetro: el diámetro de la roseta crece con el tiempo
        - Hojas: el número de hojas funcionales aumenta con la edad
        
        Args:
            altura (float): Altura de la planta en cm.
            diametro (float): Diámetro de la roseta en cm.
            hojas (int): Número de hojas funcionales.
            
        Returns:
            dict: Diccionario con la predicción simulada y los datos de entrada.
        """
        try:
            # Valores normalizados 
            altura_norm = min(1.0, altura / 200.0)  # Normalizar con respecto a 200cm
            diametro_norm = min(1.0, diametro / 150.0)  # Normalizar con respecto a 150cm
            hojas_norm = min(1.0, hojas / 60.0)  # Normalizar con respecto a 60 hojas
            
            # Calcular un valor base con mayor peso en altura y diámetro
            base_value = (altura_norm * 0.4) + (diametro_norm * 0.4) + (hojas_norm * 0.2)
            
            # Convertir el valor normalizado a años (rango típico de 0-7 años)
            years = base_value * 7.0
            
            # Añadir un poco de variación aleatoria para simular la incertidumbre del modelo real
            random_factor = 1.0 + (random.random() - 0.5) * 0.1  # ±5% variación
            years = years * random_factor
            
            # Ajustar para que tenga sentido con los datos proporcionados
            # Si es una planta muy pequeña, asegurar que tenga al menos 1 año
            if years < 1.0 and altura > 30:
                years = 1.0 + random.random() * 0.5
            
            return {
                "success": True,
                "prediccion": years,
                "datos": {
                    "altura": altura,
                    "diametro": diametro,
                    "hojas": hojas
                },
                "demo": True
            }
            
        except Exception as e:
            return {
                "success": False,
                "mensaje": f"Error en la predicción de demostración: {str(e)}"
            }

# Función para obtener el predictor apropiado
def get_predictor():
    """
    Devuelve un predictor real o uno de demostración, dependiendo de si los archivos del modelo están disponibles.
    
    Returns:
        object: Una instancia de Predictor (real) o DemoPredictor (simulación)
    """
    try:
        from .predictor import Predictor
        predictor = Predictor()
        
        # Si el modelo real no se cargó, usar la demo
        if predictor.model is None or predictor.preprocessor is None:
            print("Modelo real no disponible, usando predictor de demostración")
            return DemoPredictor()
        
        return predictor
    except Exception as e:
        print(f"Error al cargar el predictor real: {str(e)}. Usando modo demo.")
        return DemoPredictor() 