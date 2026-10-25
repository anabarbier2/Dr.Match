
from django.db import models
from .medico import Medico


class Agendamento(models.Model):
    STATUS_PENDENTE = "PENDENTE"
    STATUS_CONFIRMADO = "CONFIRMADO"
    STATUS_CANCELADO = "CANCELADO"

    STATUS_CHOICES = [
        (STATUS_PENDENTE, "Pendente"),
        (STATUS_CONFIRMADO, "Confirmado"),
        (STATUS_CANCELADO, "Cancelado"),
    ]

    medico = models.ForeignKey(
        Medico,
        on_delete=models.CASCADE,
        related_name="agendamentos",
    )

    nome_paciente = models.CharField(max_length=150)
    email_paciente = models.EmailField()
    telefone_paciente = models.CharField(max_length=20)

    data = models.DateField()
    horario = models.TimeField()

    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default=STATUS_PENDENTE,
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["data", "horario"]
        constraints = [
            models.UniqueConstraint(
                fields=["medico", "data", "horario"],
                condition=models.Q(
                    status__in=["PENDENTE", "CONFIRMADO"]
                ),
                name="agendamento_medico_data_horario_ativo_unico",
            )
        ]

    def __str__(self):
        return (
            f"{self.nome_paciente} - {self.medico} - "
            f"{self.data} {self.horario}"
        )
