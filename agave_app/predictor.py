"""
Módulo de predicción que encapsula el modelo ML para predecir el tiempo de crecimiento del agave
"""

import os
import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from django.conf import settings
from pathlib import Path

class Predictor:
    """
    Clase encargada de cargar el modelo y realizar predicciones sobre el tiempo
    de crecimiento estimado para plantas de agave tequilero.
    """
    
    def __init__(self):
        """
        Inicializa el predictor cargando el modelo y el preprocesador.
        """
        self.model = None
        self.preprocessor = None
        self.error_message = None
        
        # Obtener el directorio base de la aplicación
        base_dir = Path(settings.BASE_DIR)
        parent_dir = base_dir.parent
        
        # Definir rutas alternativas para buscar el modelo
        self.model_paths = [
            # Rutas principales (carpeta model en la raíz)
            os.path.join(parent_dir, 'model', 'modelo_agave_final.joblib'),
            os.path.join(parent_dir, 'model', 'model_agave_final.joblib'),
            # Rutas en la carpeta app/model
            os.path.join(base_dir, 'app', 'model', 'modelo_agave_final.joblib'),
            os.path.join(base_dir, 'app', 'model', 'model_agave_final.joblib'),
        ]
        
        # Definir rutas alternativas para buscar el preprocesador
        self.preprocessor_paths = [
            # Rutas principales (carpeta model en la raíz)
            os.path.join(parent_dir, 'model', 'preprocessor.pkl'),
            # Rutas en la carpeta app/model
            os.path.join(base_dir, 'app', 'model', 'preprocessor.pkl'),
        ]
        
        # Rutas encontradas
        self.model_path = None
        self.preprocessor_path = None
        
        # Imprimir información sobre el directorio actual y rutas de búsqueda
        print(f"Directorio base: {base_dir}")
        print(f"Directorio padre: {parent_dir}")
        print(f"Rutas de búsqueda del modelo: {self.model_paths}")
        print(f"Rutas de búsqueda del preprocesador: {self.preprocessor_paths}")
        
        # Intentar cargar el modelo al inicializar
        self.load_model()
    
    def load_model(self):
        """
        Carga el modelo y el preprocesador desde los archivos guardados.
        
        Returns:
            bool: True si los archivos se cargaron correctamente, False en caso contrario.
        """
        try:
            # Buscar el archivo del modelo
            for path in self.model_paths:
                print(f"Buscando modelo en: {path}")
                if os.path.exists(path):
                    print(f"¡Modelo encontrado en: {path}!")
                    self.model_path = path
                    try:
                        # Detectar el tipo de archivo
                        if path.endswith('.joblib'):
                            print("Cargando modelo joblib...")
                            self.model = joblib.load(path)
                        else:
                            print("Cargando modelo keras...")
                            self.model = tf.keras.models.load_model(path)
                        break
                    except Exception as e:
                        print(f"Error al cargar el modelo desde {path}: {e}")
            
            # Buscar el archivo del preprocesador
            for path in self.preprocessor_paths:
                print(f"Buscando preprocesador en: {path}")
                if os.path.exists(path):
                    print(f"¡Preprocesador encontrado en: {path}!")
                    self.preprocessor_path = path
                    try:
                        self.preprocessor = joblib.load(path)
                        break
                    except Exception as e:
                        print(f"Error al cargar el preprocesador desde {path}: {e}")
            
            # Verificar si ambos se cargaron correctamente
            if self.model is not None and self.preprocessor is not None:
                print("✅ Modelo y preprocesador cargados correctamente.")
                return True
            else:
                if self.model is None:
                    self.error_message = "No se pudo cargar el modelo"
                    print("⚠️ El modelo no se pudo cargar.")
                if self.preprocessor is None:
                    self.error_message = "No se pudo cargar el preprocesador"
                    print("⚠️ El preprocesador no se pudo cargar.")
                return False
        
        except Exception as e:
            self.error_message = f"Error al cargar el modelo: {str(e)}"
            print(self.error_message)
            import traceback
            traceback.print_exc()
            return False
    
    def predict(self, altura, diametro, hojas):
        """
        Realiza una predicción del tiempo de crecimiento del agave.
        
        Args:
            altura (float): Altura de la planta en cm.
            diametro (float): Diámetro de la roseta en cm.
            hojas (int): Número de hojas funcionales.
            
        Returns:
            dict: Diccionario con la predicción y los datos de entrada.
        """
        if self.model is None or self.preprocessor is None:
            # Si no tenemos modelo, intentar usar el DemoPredictor
            try:
                from .demo_predictor import DemoPredictor
                demo = DemoPredictor()
                result = demo.predict(altura, diametro, hojas)
                result["mensaje_adicional"] = "Usando modelo de demostración porque el modelo real no está disponible."
                return result
            except Exception as import_error:
                print(f"Error al cargar el predictor de demo: {import_error}")
                pass
            
            # Construir mensaje de error
            model_status = "No encontrado" if self.model is None else "Cargado"
            preprocessor_status = "No encontrado" if self.preprocessor is None else "Cargado"
            
            return {
                "success": False,
                "mensaje": f"No se puede realizar la predicción. Estado de los componentes: Modelo: {model_status}, Preprocesador: {preprocessor_status}"
            }
        
        try:
            # Creamos un diccionario con los datos de entrada
            input_data_dict = {
                'Altura_Planta_cm': [float(altura)],
                'Diametro_Roseta_cm': [float(diametro)],
                'Numero_Hojas_Funcionales': [int(hojas)]
            }
            
            # Convertimos a DataFrame
            input_df = pd.DataFrame(input_data_dict)
            
            print(f"Realizando predicción con datos: {input_data_dict}")
            
            # Aplicamos el preprocesador
            X_processed = self.preprocessor.transform(input_df)
            
            # Realizamos la predicción
            # Manejar diferentes tipos de modelos (keras vs sklearn)
            if hasattr(self.model, 'predict_proba'):
                # Modelo scikit-learn (por ejemplo, RandomForest)
                prediction = self.model.predict(X_processed)
                years_prediction = float(prediction[0])
            else:
                # Modelo keras/tensorflow
                prediction = self.model.predict(X_processed)
                years_prediction = float(prediction[0][0])
            
            print(f"Predicción exitosa: {years_prediction} años")
            
            return {
                "success": True,
                "prediccion": years_prediction,
                "datos": {
                    "altura": altura,
                    "diametro": diametro,
                    "hojas": hojas
                }
            }
            
        except Exception as e:
            self.error_message = f"Error al realizar la predicción: {str(e)}"
            print(self.error_message)
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "mensaje": self.error_message
            } 