import json
from json import JSONDecodeError
from django.http import JsonResponse
from django.views import View
from django.shortcuts import get_object_or_404
from app.models import Medico
from app.forms import MedicoForm
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET

class MedicoView(View):
    def get(self, request, id=None, *args, **kwargs):
        if id is not None:
            medico = get_object_or_404(Medico, id=id)
            return JsonResponse(self.dados_medico(medico))

        medicos = Medico.objects.all().order_by('nome')
        busca = request.GET.get('busca', '').strip()
        especialidade = request.GET.get('especialidade', '').strip()

        if busca:
            medicos = medicos.filter(nome__icontains=busca)
        if especialidade:
            medicos = medicos.filter(especialidade__icontains=especialidade)

        return JsonResponse([self.dados_medico(medico) for medico in medicos], safe=False)

    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
        except (JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'errors': {'json': ['Envie um JSON válido.']}}, status=400)

        form = MedicoForm(data)
        if not form.is_valid():
            return JsonResponse({'errors': form.errors.get_json_data()}, status=400)

        medico = Medico.objects.create(**form.cleaned_data)
        return JsonResponse({
            **self.dados_medico(medico),
            'status': 'Médico cadastrado com sucesso.'
        }, status=201)

    def put(self, request, id=None, *args, **kwargs):
        if id is None:
            return JsonResponse({'erro': 'Informe o ID do médico na URL.'}, status=400)
        medico = get_object_or_404(Medico, id=id)
        try:
            data = json.loads(request.body)
        except (JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'errors': {'json': ['Envie um JSON válido.']}}, status=400)

        form = MedicoForm(data, medico=medico)
        if not form.is_valid():
            return JsonResponse({'errors': form.errors.get_json_data()}, status=400)

        for campo, valor in form.cleaned_data.items():
            setattr(medico, campo, valor)
        medico.save()
        return JsonResponse({**self.dados_medico(medico), 'status': 'Médico atualizado com sucesso.'})

    def delete(self, request, id=None, *args, **kwargs):
        if id is None:
            return JsonResponse({'erro': 'Informe o ID do médico na URL.'}, status=400)
        medico = get_object_or_404(Medico, id=id)
        medico.delete()
        return JsonResponse({'status': 'Médico excluído com sucesso.'})

    @staticmethod
    def dados_medico(medico):
        return {
            'id': medico.id,
            'nome': medico.nome,
            'crm': medico.crm,
            'especialidade': medico.especialidade,
            'telefone': medico.telefone,
            'email': medico.email,
            'convenio': medico.convenio,
        }
@require_GET
@ensure_csrf_cookie
def obter_csrf(request):
    return JsonResponse({'mensagem': 'Cookie CSRF gerado.'})
@ensure_csrf_cookie
def pagina_cadastro(request):
    return render(request, 'cadastro_medico.html')