from django.urls import path
from . import views

app_name = 'agave_app'  # Agregar un namespace para la aplicación

urlpatterns = [
    path('', views.home, name='home'),
    path('predict/', views.predict, name='predict'),
] 