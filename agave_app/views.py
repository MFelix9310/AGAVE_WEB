"""
Vistas para la aplicación de predicción de crecimiento del agave
"""

from django.shortcuts import render
from django.http import JsonResponse
import json
import traceback
import os
from django.conf import settings
from pathlib import Path
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.views import View

# Crear una instancia del predictor adecuado
def get_predictor():
    try:
        # Intentar usar el predictor real primero
        from .predictor import Predictor
        predictor = Predictor()
        
        # Si no se cargaron los modelos, intentar con el demo
        if predictor.model is None or predictor.preprocessor is None:
            try:
                from .demo_predictor import DemoPredictor
                return DemoPredictor()
            except ImportError:
                return predictor
        return predictor
    except Exception as e:
        print(f"Error al inicializar el predictor: {e}")
        try:
            from .demo_predictor import DemoPredictor
            return DemoPredictor()
        except ImportError:
            return None

# Intentar ubicar los archivos del modelo
def check_model_files():
    base_dir = Path(settings.BASE_DIR)
    parent_dir = base_dir.parent
    
    # Posibles ubicaciones para el modelo
    model_locations = [
        os.path.join(parent_dir, 'model', 'modelo_agave_final.joblib'),
        os.path.join(parent_dir, 'model', 'model_agave_final.joblib'),
        os.path.join(settings.MODEL_DIR, 'modelo_agave_final.joblib'),
        os.path.join(settings.MODEL_DIR, 'model_agave_final.joblib'),
        os.path.join(base_dir, 'app', 'model', 'modelo_agave_final.joblib'),
        os.path.join(base_dir, 'app', 'model', 'model_agave_final.joblib')
    ]
    
    # Posibles ubicaciones para el preprocesador
    preprocessor_locations = [
        os.path.join(parent_dir, 'model', 'preprocessor.pkl'),
        os.path.join(settings.MODEL_DIR, 'preprocessor.pkl'),
        os.path.join(base_dir, 'app', 'model', 'preprocessor.pkl')
    ]
    
    # Verificar cuáles archivos existen
    found_model = next((path for path in model_locations if os.path.exists(path)), None)
    found_preprocessor = next((path for path in preprocessor_locations if os.path.exists(path)), None)
    
    return {
        'model': found_model,
        'preprocessor': found_preprocessor
    }

# Creamos una instancia global del predictor para reutilizarla
predictor = get_predictor()

@ensure_csrf_cookie
def home(request):
    """
    Vista para la página principal que muestra el formulario de predicción
    """
    # Verificar si los archivos del modelo existen y pasar esa información al template
    model_files = check_model_files()
    context = {
        'model_found': model_files['model'] is not None,
        'preprocessor_found': model_files['preprocessor'] is not None,
        'model_path': model_files['model'] or "No encontrado",
        'preprocessor_path': model_files['preprocessor'] or "No encontrado"
    }
    
    return render(request, 'agave_app/index.html', context)

@csrf_exempt
def predict(request):
    """
    Vista para procesar la predicción via AJAX
    """
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'mensaje': 'Solo se aceptan solicitudes POST'
        })
    
    try:
        # Verificar si hay un body en la solicitud
        if not request.body:
            return JsonResponse({
                'success': False,
                'mensaje': 'No se recibieron datos en la solicitud'
            })
            
        # Obtenemos los datos del formulario
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'mensaje': 'Formato de datos inválido. Se esperaba JSON.'
            })
            
        # Extraer valores
        altura = data.get('altura')
        diametro = data.get('diametro')
        hojas = data.get('hojas')
        
        # Verificamos si los datos están completos
        if altura is None or diametro is None or hojas is None:
            return JsonResponse({
                'success': False,
                'mensaje': 'Todos los campos son requeridos y deben ser numéricos'
            })
        
        # Verificamos que los valores sean numéricos y positivos
        try:
            altura = float(altura)
            diametro = float(diametro)
            hojas = int(hojas)
            
            if altura <= 0 or diametro <= 0 or hojas <= 0:
                return JsonResponse({
                    'success': False,
                    'mensaje': 'Todos los valores deben ser positivos'
                })
        
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'mensaje': 'Todos los campos son requeridos y deben ser numéricos'
            })
        
        # Verificar si el predictor está disponible
        if predictor is None:
            model_files = check_model_files()
            return JsonResponse({
                'success': False,
                'mensaje': 'No se pudo cargar el predictor. Archivos disponibles: ' + 
                          ('Modelo: Sí, ' if model_files['model'] else 'Modelo: No, ') +
                          ('Preprocesador: Sí' if model_files['preprocessor'] else 'Preprocesador: No')
            })
            
        # Realizamos la predicción
        result = predictor.predict(altura, diametro, hojas)
        
        return JsonResponse(result)
            
    except Exception as e:
        # Capturar y registrar excepciones inesperadas
        error_trace = traceback.format_exc()
        print(f"Error inesperado: {str(e)}\n{error_trace}")
        
        return JsonResponse({
            'success': False,
            'mensaje': f'Error interno: {str(e)}'
        }) 