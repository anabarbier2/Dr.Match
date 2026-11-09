from django.db import models
from django.utils import timezone
from .medico import Medico


class PagamentoDemo(models.Model):

    PIX = "PIX"
    CARTAO = "CARTAO"

    METODOS = [
        (PIX, "Pix"),
        (CARTAO, "Cartão"),
    ]

    PENDENTE = "PENDENTE"
    APROVADO = "APROVADO"

    STATUS = [
        (PENDENTE, "Pendente"),
        (APROVADO, "Aprovado"),
    ]

    medico = models.OneToOneField(
        Medico,
        on_delete=models.CASCADE,
        related_name="pagamento_demo"
    )

    plano = models.CharField(max_length=30)

    valor = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    metodo = models.CharField(
        max_length=10,
        choices=METODOS
    )

    status = models.CharField(
        max_length=15,
        choices=STATUS,
        default=PENDENTE
    )

    criado_em = models.DateTimeField(auto_now_add=True)

    aprovado_em = models.DateTimeField(
        null=True,
        blank=True
    )

    def aprovar(self):
        self.status = self.APROVADO
        self.aprovado_em = timezone.now()
        self.save(update_fields=["status", "aprovado_em"])

    def __str__(self):
        return f"{self.medico.nome} - {self.status}"