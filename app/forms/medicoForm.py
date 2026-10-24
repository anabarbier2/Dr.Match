from csv import reader

from django import forms
from app.models import Medico
from app.especialidades import ESPECIALIDADES_MEDICAS
import re


class MedicoForm(forms.Form):
    def __init__(self, *args, medico=None, **kwargs):
        self.medico = medico
        super().__init__(*args, **kwargs)

    nome = forms.CharField(max_length=100)
    crm = forms.CharField(max_length=20)

    especialidade = forms.CharField(max_length=100)
    telefone = forms.CharField(max_length=20)
    email = forms.EmailField()
    convenio = forms.CharField(max_length=100, required=False)

    def clean_telefone(self):
        data = self.cleaned_data["telefone"]
        data = re.sub(r"[^0-9+]", "", data)

        if len(re.sub(r"\D", "", data)) < 10:
            raise forms.ValidationError("Informe um telefone válido.")

        return data

    def clean_crm(self):
        data = self.cleaned_data["crm"].strip().upper()
        consulta = Medico.objects.filter(crm=data)

        if self.medico is not None:
            consulta = consulta.exclude(id=self.medico.id)

        if consulta.exists():
            raise forms.ValidationError(
                "Já existe um médico cadastrado com esse CRM."
            )

        return data
def pagina_buscar_medicos(request):
    return render(request, 'buscar_medico.html')
