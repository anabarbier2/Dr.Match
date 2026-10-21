
from django.contrib import admin
from django.urls import path
from app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('medicos/', views.MedicoView.as_view(), name='medicos'),
    path('csrftoken/', views.CsrfTokenView.as_view(), name='csrftoken'),
    path('csrf/', views.CsrfTokenView.as_view(), name='obter_csrf'),
    path('cadastro/', views.pagina_cadastro, name='pagina_cadastro'),
]
