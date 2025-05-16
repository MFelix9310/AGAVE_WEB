# AgavePredictor ML - Aplicación Web

ML application predicting agave growth time (R²=0.92) using RandomForest and web-scraped data. Features interactive Django web interface with dynamic plant visualizations. Supports sustainable agave farming through precise growth predictions.

## Características

*   Modelo predictivo con R² = 0.92 logrado mediante optimización sistemática de ML
*   Implementaciones avanzadas de RandomForest para máxima precisión
*   Técnicas de ingeniería de datos incluyendo eliminación de valores atípicos
*   Web scraping para la recolección de datos originales
*   8,000 observaciones sintéticas generadas para mejorar el rendimiento
*   Interfaz web intuitiva desarrollada con Django
*   Visualización dinámica del agave que se adapta a los parámetros introducidos
*   Animaciones del proceso predictivo y una elegante interfaz con paleta de colores inspirada en el agave
*   Diseño responsivo para dispositivos móviles y de escritorio

## Estructura del Proyecto

```
agave_predictor_web/
├── agave_app/                         # Aplicación Django principal
│   ├── static/                       # Archivos estáticos (CSS, JS, imágenes)
│   │   ├── css/                    # Hojas de estilo
│   │   │   └── styles.css
│   │   ├── js/                     # Scripts JavaScript
│   │   │   └── script.js
│   │   └── img/                    # Imágenes y recursos
│   ├── templates/                    # Plantillas HTML
│   │   └── agave_app/
│   │       └── index.html
│   ├── __init__.py
│   ├── apps.py                      # Configuración de la aplicación
│   ├── models.py                    # Modelos de datos
│   ├── predictor.py                 # Clase para hacer predicciones
│   ├── urls.py                      # URLs de la aplicación
│   └── views.py                     # Vistas y lógica de negocio
├── agave_predictor_web/              # Configuración del proyecto Django
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py                  # Configuración del proyecto
│   ├── urls.py                      # URLs del proyecto
│   └── wsgi.py
├── model/                            # Directorio para modelos ML
│   ├── modelo_agave_final.keras     # Modelo TensorFlow guardado
│   └── preprocessor.pkl             # Preprocesador scikit-learn
├── manage.py                         # Script de gestión de Django
├── requirements.txt                  # Dependencias del proyecto
└── README.md                         # Este archivo
```

## Requisitos Previos

*   Python 3.8 o superior
*   Django 4.2 o superior
*   TensorFlow 2.12 o superior
*   Scikit-learn 1.2 o superior

## Configuración del Entorno

1.  **Clonar el repositorio**

2.  **Crear un entorno virtual:**
    ```bash
    python -m venv venv
    ```
    Activar el entorno virtual:
    *   En Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    *   En macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

3.  **Instalar dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Colocar los archivos del modelo en la carpeta `/model`:**
    *   `modelo_agave_final.keras` - El modelo TensorFlow entrenado
    *   `preprocessor.pkl` - El preprocesador scikit-learn guardado

## Ejecución de la Aplicación

1.  **Ejecutar las migraciones de Django:**
    ```bash
    python manage.py migrate
    ```

2.  **Iniciar el servidor de desarrollo:**
    ```bash
    python manage.py runserver
    ```

3.  **Acceder a la aplicación:**
    Abrir el navegador y visitar [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## Despliegue en Producción

Para desplegar la aplicación en un entorno de producción:

1.  **Configurar las variables de entorno:**
    *   `DEBUG=False`
    *   `SECRET_KEY=your_secure_key`
    *   `ALLOWED_HOSTS=your-domain.com`

2.  **Recopilar archivos estáticos:**
    ```bash
    python manage.py collectstatic
    ```

3.  **Configurar un servidor web como Nginx o Apache para servir la aplicación**

4.  **Utilizar Gunicorn como servidor WSGI:**
    ```bash
    gunicorn agave_predictor_web.wsgi:application
    ```

## Comparación con la Versión de Escritorio

Esta versión web ofrece varias ventajas sobre la aplicación de escritorio original:

*   **Accesibilidad**: No requiere instalación local, accesible desde cualquier dispositivo con navegador
*   **Mantenimiento**: Actualizaciones centralizadas sin necesidad de que los usuarios actualicen
*   **Escalabilidad**: Puede atender a múltiples usuarios simultáneamente
*   **Multiplataforma**: Funciona en Windows, macOS, Linux, iOS, Android, etc.
*   **Reducción de recursos**: La carga computacional se gestiona en el servidor

La versión web mantiene la misma funcionalidad principal y estética de la aplicación de escritorio, pero en un formato más accesible y con diseño responsivo.

---

Desarrollado con Django, TensorFlow y RandomForest para proporcionar predicciones precisas de crecimiento del agave. 