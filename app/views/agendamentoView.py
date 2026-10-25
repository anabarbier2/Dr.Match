
import json
from datetime import date, time

from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.shortcuts import render, get_object_or_404
from app.models import Agendamento, Medico


@require_GET
def horarios_ocupados(request):
    medico_id = request.GET.get("medico")
    data_consulta = request.GET.get("data")

    if not medico_id or not data_consulta:
        return JsonResponse(
            {"erro": "Informe o médico e a data."},
            status=400,
        )

    try:
        data_selecionada = date.fromisoformat(data_consulta)
        medico = Medico.objects.get(pk=medico_id)
    except (ValueError, Medico.DoesNotExist):
        return JsonResponse(
            {"erro": "Médico ou data inválidos."},
            status=400,
        )

    if data_selecionada < date.today():
        return JsonResponse(
            {"erro": "Não é possível consultar datas passadas."},
            status=400,
        )

    ocupados = Agendamento.objects.filter(
        medico=medico,
        data=data_selecionada,
        status__in=[
            Agendamento.STATUS_PENDENTE,
            Agendamento.STATUS_CONFIRMADO,
        ],
    ).values_list("horario", flat=True)

    return JsonResponse({
        "medico": medico.nome,
        "data": data_selecionada.isoformat(),
        "horarios_ocupados": [
            horario.strftime("%H:%M") for horario in ocupados
        ],
    })


@require_POST
def criar_pre_agendamento(request):
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"erro": "Os dados enviados são inválidos."},
            status=400,
        )

    nome = str(dados.get("nome", "")).strip()
    email = str(dados.get("email", "")).strip()
    telefone = str(dados.get("telefone", "")).strip()
    medico_id = dados.get("medico")
    data_consulta = dados.get("data")
    horario_consulta = dados.get("horario")

    if not all([
        nome, email, telefone, medico_id,
        data_consulta, horario_consulta,
    ]):
        return JsonResponse(
            {"erro": "Preencha todos os campos."},
            status=400,
        )

    if len(nome) > 150 or len(telefone) > 20:
        return JsonResponse(
            {"erro": "Confira o tamanho do nome e do telefone."},
            status=400,
        )

    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError

    try:
        validate_email(email)
        data_selecionada = date.fromisoformat(data_consulta)
        horario_selecionado = time.fromisoformat(horario_consulta)

        medico = Medico.objects.get(pk=int(medico_id))
    except (ValidationError, ValueError, TypeError, Medico.DoesNotExist):
        return JsonResponse(
            {"erro": "Confira o e-mail, médico, data e horário."},
            status=400,
        )

    if data_selecionada < date.today():
        return JsonResponse(
            {"erro": "Escolha uma data de hoje em diante."},
            status=400,
        )

    if horario_selecionado.second or horario_selecionado.microsecond:
        return JsonResponse(
            {"erro": "O horário informado é inválido."},
            status=400,
        )

    try:
        with transaction.atomic():
            agendamento = Agendamento.objects.create(
                medico=medico,
                nome_paciente=nome,
                email_paciente=email,
                telefone_paciente=telefone,
                data=data_selecionada,
                horario=horario_selecionado,
                status=Agendamento.STATUS_PENDENTE,
            )
    except IntegrityError:
        return JsonResponse(
            {
                "erro": (
                    "Esse horário acabou de ser solicitado. "
                    "Escolha outro horário."
                )
            },
            status=409,
        )

    return JsonResponse(
        {
            "mensagem": (
                "Pré-agendamento solicitado! Entre em contato "
                "com o médico para confirmar sua consulta."
            ),
            "agendamento_id": agendamento.pk,
            "status": agendamento.status,
        },
        status=201,
    )
def pagina_agendamento(request):
    medico_id = request.GET.get("medico")
    medico = None

    if medico_id:
        medico = get_object_or_404(Medico, pk=medico_id)

    return render(
        request,
        "agendamento.html",
        {"medico": medico},
    )