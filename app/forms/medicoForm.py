
import re

from django import forms
from app.models import Medico


class MedicoForm(forms.Form):
    def __init__(self, *args, medico=None, **kwargs):
        self.medico = medico
        super().__init__(*args, **kwargs)

    # 1. Dados profissionais
    nome = forms.CharField(max_length=100)
    crm = forms.CharField(max_length=20)
    estado_crm = forms.CharField(max_length=2, required=False)
    especialidade = forms.CharField(max_length=100)

    # 2. Contato
    email = forms.EmailField()
    telefone = forms.CharField(max_length=20)
    cidade = forms.CharField(max_length=100, required=False)
    estado = forms.CharField(max_length=2, required=False)

    # 3. Perfil e atendimento
    biografia = forms.CharField(required=False)
    tipo_atendimento = forms.CharField(max_length=30, required=False)
    convenio = forms.CharField(max_length=255, required=False)
    endereco = forms.CharField(max_length=255, required=False)

    # 4. Plano escolhido
    plano = forms.CharField(max_length=30)

    def clean_telefone(self):
        data = self.cleaned_data["telefone"]
        data = re.sub(r"[^0-9+]", "", data)

        if len(re.sub(r"\D", "", data)) < 10:
            raise forms.ValidationError(
                "Informe um telefone válido."
            )

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

    def clean_nome(self):
        return self.cleaned_data["nome"].strip()

    def clean_email(self):
        return self.cleaned_data["email"].strip().lower()

    def clean_especialidade(self):
        return self.cleaned_data["especialidade"].strip()
