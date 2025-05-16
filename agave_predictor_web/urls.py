"""
URL configuration for agave_predictor_web project.
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Redirigir la raíz a la app
    path('', include('agave_app.urls')),
    # Redirección simple para portfolio
    path('portfolio/', RedirectView.as_view(url='/', permanent=True)),
] 