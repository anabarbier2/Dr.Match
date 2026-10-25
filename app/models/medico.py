
from django.db import models


class Medico(models.Model):
    # Dados profissionais
    nome = models.CharField(max_length=100)
    crm = models.CharField(max_length=20, unique=True)
    estado_crm = models.CharField(max_length=2, blank=True)
    especialidade = models.CharField(max_length=100)

    # Contato
    email = models.EmailField()
    telefone = models.CharField(max_length=20)
    cidade = models.CharField(max_length=100, blank=True)
    estado = models.CharField(max_length=2, blank=True)

    # Perfil e atendimento
    biografia = models.TextField(blank=True)
    tipo_atendimento = models.CharField(max_length=30, blank=True)
    convenio = models.CharField(max_length=255, blank=True)
    endereco = models.CharField(max_length=255, blank=True)

    # Plano escolhido
    plano = models.CharField(max_length=30)

    def __str__(self):
        return self.nome
