from django.urls import path
from app.views import MedicoView, CsrfTokenView
from app.views.medicoView import obter_csrf, perfil_medico
from app.views import MedicoView, pagina_cadastro
from app.views.pagamentoView import pagina_pagamento
from app.views.agendamentoView import (criar_pre_agendamento, horarios_ocupados, pagina_agendamento,meus_agendamentos,)
urlpatterns = [
    path('medicos/', MedicoView.as_view(), name='medicos'),
    path('medicos/<int:id>/', MedicoView.as_view(), name='medico_detalhe'),
    path('csrftoken/', CsrfTokenView.as_view(), name='csrftoken'),
    path('csrf/', obter_csrf, name='obter_csrf'),
    path('cadastro/', pagina_cadastro, name='pagina_cadastro'),
    path('agendamentos/horarios-ocupados/', horarios_ocupados, name='horarios_ocupados'),
    path('agendamentos/criar/', criar_pre_agendamento, name='criar_pre_agendamento'),
    path(
    "agendamento/", pagina_agendamento, name="pagina_agendamento",),
    path('medicos/<int:medico_id>/perfil/', perfil_medico, name='perfil_medico',),
    path("meus-agendamentos/", meus_agendamentos, name="meus_agendamentos"),
    path("pagamento/<int:medico_id>/", pagina_pagamento, name="pagina_pagamento"),
]
