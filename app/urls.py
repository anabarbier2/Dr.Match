from django.urls import path
from app.views import MedicoView, CsrfTokenView
from app.views.medicoView import obter_csrf
from app.views import MedicoView, pagina_cadastro

urlpatterns = [
    path('medicos/', MedicoView.as_view(), name='medicos'),
    path('medicos/<int:id>/', MedicoView.as_view(), name='medico_detalhe'),
    path('csrftoken/', CsrfTokenView.as_view(), name='csrftoken'),
    path('csrf/', obter_csrf, name='obter_csrf'),
    path('cadastro/', pagina_cadastro, name='pagina_cadastro'),
]
