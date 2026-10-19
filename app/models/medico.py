from django.db import models


class Medico(models.Model):
    nome = models.CharField(max_length=100)
    crm = models.CharField(max_length=20, unique=True)
    especialidade = models.CharField(max_length=100)
    telefone = models.CharField(max_length=20)
    email = models.EmailField()
    convenio = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.nome
