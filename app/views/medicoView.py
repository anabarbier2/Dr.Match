import json
from json import JSONDecodeError

from django.http import JsonResponse
from django.views import View
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET

from app.models import Medico
from app.forms import MedicoForm


class MedicoView(View):

    def get(self, request, id=None, *args, **kwargs):

        if id is not None:
            medico = get_object_or_404(
                Medico,
                id=id,
                perfil_liberado=True
            )

            return JsonResponse(self.dados_medico(medico))

        medicos = Medico.objects.filter(
            perfil_liberado=True
        ).order_by("nome")

        busca = request.GET.get("busca", "").strip()
        especialidade = request.GET.get("especialidade", "").strip()

        if busca:
            medicos = medicos.filter(nome__icontains=busca)

        if especialidade:
            medicos = medicos.filter(
            especialidade__icontains=especialidade
            )

        todos = request.GET.get("todos") == "1"

        if not busca and not especialidade and not todos:
                medicos = medicos[:4]
        return JsonResponse(
            [self.dados_medico(medico) for medico in medicos],
            safe=False
        )


    def post(self, request, *args, **kwargs):

        try:
            data = json.loads(request.body)

        except (JSONDecodeError, UnicodeDecodeError):
            return JsonResponse(
                {"errors": {"json": ["Envie um JSON válido."]}},
                status=400
            )

        form = MedicoForm(data)

        if not form.is_valid():
            return JsonResponse(
                {"errors": form.errors.get_json_data()},
                status=400
            )
        if form.cleaned_data.get("plano") == "profissional":
            return JsonResponse(
                {
                    "errors": {
                        "plano": [
                            "O Plano Profissional estará disponível em breve."
                        ]
                    }
                },
                status=400
            )

        # O médico é cadastrado, mas ainda não aparece no diretório.
        medico = Medico.objects.create(
            **form.cleaned_data,
            perfil_liberado=False
        )

        return JsonResponse(
            {
                **self.dados_medico(medico),
                "status": "Cadastro realizado. Aguardando pagamento demonstrativo."
            },
            status=201
        )

    def put(self, request, id=None, *args, **kwargs):

        if id is None:
            return JsonResponse(
                {"erro": "Informe o ID do médico na URL."},
                status=400
            )

        medico = get_object_or_404(Medico, id=id)

        try:
            data = json.loads(request.body)

        except (JSONDecodeError, UnicodeDecodeError):
            return JsonResponse(
                {"errors": {"json": ["Envie um JSON válido."]}},
                status=400
            )

        form = MedicoForm(data, medico=medico)

        if not form.is_valid():
            return JsonResponse(
                {"errors": form.errors.get_json_data()},
                status=400
            )

        for campo, valor in form.cleaned_data.items():
            setattr(medico, campo, valor)

        medico.save()

        return JsonResponse({
            **self.dados_medico(medico),
            "status": "Médico atualizado com sucesso."
        })

    def delete(self, request, id=None, *args, **kwargs):

        if id is None:
            return JsonResponse(
                {"erro": "Informe o ID do médico na URL."},
                status=400
            )

        medico = get_object_or_404(Medico, id=id)
        medico.delete()

        return JsonResponse({
            "status": "Médico excluído com sucesso."
        })

    @staticmethod
    def dados_medico(medico):

        return {
            "id": medico.id,
            "nome": medico.nome,
            "crm": medico.crm,
            "estado_crm": medico.estado_crm,
            "especialidade": medico.especialidade,
            "email": medico.email,
            "telefone": medico.telefone,
            "cidade": medico.cidade,
            "estado": medico.estado,
            "biografia": medico.biografia,
            "tipo_atendimento": medico.tipo_atendimento,
            "convenio": medico.convenio,
            "endereco": medico.endereco,
            "plano": medico.plano,
        }


@require_GET
@ensure_csrf_cookie
def obter_csrf(request):
    return JsonResponse({
        "mensagem": "Cookie CSRF gerado."
    })


@ensure_csrf_cookie
def pagina_cadastro(request):
    return render(request, "cadastro_medico.html")


def pagina_buscar_medicos(request):
    return render(request, "buscar_medico.html")


def perfil_medico(request, medico_id):

    medico = get_object_or_404(
        Medico,
        id=medico_id,
        perfil_liberado=True
    )

    return render(
        request,
        "perfil_medico.html",
        {"medico": medico}
    )