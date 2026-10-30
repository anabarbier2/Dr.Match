document.addEventListener("DOMContentLoaded", () => {
    const elemento = document.getElementById("calendario-medico");
    const mensagem = document.getElementById("mensagem-agenda");
    const medicoId = window.DRMATCH_MEDICO_ID;

    const painel = document.getElementById("horarios-do-dia");
    const dataTexto = document.getElementById("data-selecionada");
    const mensagemHorarios = document.getElementById("mensagem-horarios");
    const lista = document.getElementById("lista-horarios");

    if (!elemento || !mensagem || !painel || !dataTexto ||
        !mensagemHorarios || !lista || !medicoId) {
        console.error("Dr.Match: confira os elementos HTML do calendário.");
        return;
    }

    if (typeof FullCalendar === "undefined") {
        mensagem.textContent = "O calendário não foi carregado.";
        return;
    }

    const horariosPossiveis = [
        "08:00", "08:30", "09:00", "09:30",
        "10:00", "10:30", "11:00", "11:30",
        "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30"
    ];

    function dataLocalISO() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    async function consultarHorarios(data) {
        painel.hidden = false;
        dataTexto.textContent = data.split("-").reverse().join("/");
        mensagemHorarios.textContent = "Consultando horários...";
        lista.replaceChildren();

        try {
            const parametros = new URLSearchParams({
                medico: medicoId,
                data
            });

            const resposta = await fetch(
                `/agendamentos/horarios-ocupados/?${parametros}`
            );

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || "Erro ao consultar horários.");
            }

            const ocupados = resultado.horarios_ocupados || [];
            const hoje = dataLocalISO();
            const agora = new Date();
            const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

            let quantidadeDisponivel = 0;

            horariosPossiveis.forEach((horario) => {
                const botao = document.createElement("button");
                botao.type = "button";
                botao.textContent = horario;

                const [hora, minuto] = horario.split(":").map(Number);
                const minutosHorario = hora * 60 + minuto;

                const horarioOcupado = ocupados.includes(horario);
                const horarioPassado = data === hoje &&
                    minutosHorario <= minutosAgora;

                if (horarioOcupado) {
                    botao.className = "horario-ocupado";
                    botao.disabled = true;
                    botao.title = "Horário já solicitado ou confirmado";
                } else if (horarioPassado) {
                    botao.className = "horario-indisponivel";
                    botao.disabled = true;
                    botao.title = "Horário já passou";
                } else {
                    botao.className = "horario-disponivel";
                    quantidadeDisponivel++;

                    botao.addEventListener("click", () => {
                        window.location.href =
                            `/agendamento/?medico=${encodeURIComponent(medicoId)}` +
                            `&data=${encodeURIComponent(data)}` +
                            `&horario=${encodeURIComponent(horario)}`;
                    });
                }

                lista.appendChild(botao);
            });

            mensagemHorarios.textContent = quantidadeDisponivel
                ? "Horários disponíveis e ocupados:"
                : "Não há horários disponíveis nesta data. Os horários ocupados aparecem em vermelho.";

            mensagem.textContent = "";
        } catch (erro) {
            mensagemHorarios.textContent =
                erro.message || "Não foi possível consultar os horários.";
        }
    }

    const calendario = new FullCalendar.Calendar(elemento, {
        initialView: "dayGridMonth",
        locale: "pt-br",
        height: "auto",
        contentHeight: 450,
        fixedWeekCount: false,

        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth"
        },

        buttonText: {
            today: "Hoje",
            month: "Mês"
        },

        validRange: {
            start: dataLocalISO()
        },

        dateClick(info) {
            consultarHorarios(info.dateStr);
        }
    });

    calendario.render();
});