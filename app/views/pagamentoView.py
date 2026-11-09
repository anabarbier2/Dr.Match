from decimal import Decimal

from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_http_methods
from django.utils import timezone

from app.models import Medico, PagamentoDemo


PLANOS = {
    "basico": Decimal("79.00"),
    "profissional": Decimal("149.00"),
}


@require_http_methods(["GET", "POST"])
def pagina_pagamento(request, medico_id):

    medico = get_object_or_404(
        Medico,
        id=medico_id
    )

    valor = PLANOS.get(medico.plano)

    if valor is None:
        return render(
            request,
            "pagamento_demo.html",
            {
                "medico": medico,
                "erro": "O plano selecionado não é válido."
            },
            status=400
        )

    pagamento = PagamentoDemo.objects.filter(
        medico=medico
    ).first()

    # GET: apenas exibe a página. Não aprova pagamento.
    if request.method == "GET":

        aprovado = (
            pagamento is not None
            and pagamento.status == PagamentoDemo.APROVADO
        )

        return render(
            request,
            "pagamento_demo.html",
            {
                "medico": medico,
                "valor": valor,
                "pagamento": pagamento,
                "aprovado": aprovado,
            }
        )

    # POST: só chega aqui quando o formulário é enviado.
    metodo = request.POST.get("metodo")

    if metodo not in [PagamentoDemo.PIX, PagamentoDemo.CARTAO]:

        return render(
            request,
            "pagamento_demo.html",
            {
                "medico": medico,
                "valor": valor,
                "erro": "Selecione Pix ou cartão para continuar."
            },
            status=400
        )

    # Evita criar outro pagamento se já estiver aprovado.
    if pagamento and pagamento.status == PagamentoDemo.APROVADO:

        return render(
            request,
            "pagamento_demo.html",
            {
                "medico": medico,
                "valor": valor,
                "pagamento": pagamento,
                "aprovado": True,
            }
        )

    pagamento, _ = PagamentoDemo.objects.update_or_create(
        medico=medico,
        defaults={
            "plano": medico.plano,
            "valor": valor,
            "metodo": metodo,
            "status": PagamentoDemo.APROVADO,
            "aprovado_em": timezone.now(),
        }
    )

    # Libera o perfil somente depois do POST de aprovação.
    medico.perfil_liberado = True
    medico.save(update_fields=["perfil_liberado"])

    return render(
        request,
        "pagamento_demo.html",
        {
            "medico": medico,
            "valor": valor,
            "pagamento": pagamento,
            "aprovado": True,
        }
    )