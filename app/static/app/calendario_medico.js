
document.addEventListener("DOMContentLoaded", function () {
    const elemento = document.getElementById("calendario-medico");
    const mensagem = document.getElementById("mensagem-agenda");

    if (!elemento) {
        console.error("Dr.Match: elemento do calendário não encontrado.");
        return;
    }

    function mostrarErro(texto) {
        mensagem.textContent = texto;
        console.error("Dr.Match:", texto);
    }

    if (typeof FullCalendar === "undefined") {
        mostrarErro(
            "O calendário não carregou. Verifique sua conexão com a internet e atualize a página."
        );
        return;
    }

    const medicoId = window.DRMATCH_MEDICO_ID;

    if (!medicoId) {
        mostrarErro("Não foi possível identificar o médico.");
        return;
    }

    function dataLocalISO(data = new Date()) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
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

        dateClick: async function (info) {
            const data = info.dateStr;

            mensagem.textContent = "Consultando horários...";
            let painel = document.getElementById("horarios-do-dia");
            let dataTexto = document.getElementById("data-selecionada");
            let mensagemHorarios = document.getElementById("mensagem-horarios");
            let lista = document.getElementById("lista-horarios");

            if (!painel || !dataTexto || !mensagemHorarios || !lista) {
                mostrarErro("Não foi possível abrir os horários desta data.");
                return;
            }

            painel.hidden = false;
            dataTexto.textContent = data.split("-").reverse().join("/");
            mensagemHorarios.textContent = "Carregando horários...";
            lista.replaceChildren();

            try {
                const parametros = new URLSearchParams({
                    medico: medicoId,
                    data: data
                });

                const resposta = await fetch(
                    `/agendamentos/horarios-ocupados/?${parametros.toString()}`
                );

                const resultado = await resposta.json();

                if (!resposta.ok) {
                    throw new Error(
                        resultado.erro || "Não foi possível consultar a agenda."
                    );
                }

                const horariosPossiveis = [
                    "08:00", "08:30",
                    "09:00", "09:30",
                    "10:00", "10:30",
                    "11:00", "11:30",
                    "13:00", "13:30",
                    "14:00", "14:30",
                    "15:00", "15:30",
                    "16:00", "16:30"
                ];

                const ocupados = resultado.horarios_ocupados || [];
                const agora = new Date();
                const hoje = dataLocalISO();
                const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

                const disponiveis = horariosPossiveis.filter(function (horario) {
                    if (ocupados.includes(horario)) {
                        return false;
                    }

                    if (data === hoje) {
                        const partes = horario.split(":").map(Number);
                        if (partes[0] * 60 + partes[1] <= minutosAgora) {
                            return false;
                        }
                    }

                    return true;
                });

                mensagem.textContent = "";

                if (disponiveis.length === 0) {
                    mensagemHorarios.textContent =
                        "Não há horários disponíveis nesta data.";
                    return;
                }

                mensagemHorarios.textContent = "Horários disponíveis:";

                disponiveis.forEach(function (horario) {
                    const botao = document.createElement("button");

                    botao.type = "button";
                    botao.className = "horario-disponivel";
                    botao.textContent = horario;

                    botao.addEventListener("click", function () {
                        window.location.href =
                            `/agendamento/?medico=${encodeURIComponent(medicoId)}` +
                            `&data=${encodeURIComponent(data)}` +
                            `&horario=${encodeURIComponent(horario)}`;
                    });

                    lista.appendChild(botao);
                });
            } catch (erro) {
                mensagemHorarios.textContent =
                    erro.message || "Erro ao consultar os horários.";
            }
        }
    });

    try {
        calendario.render();
        console.log("Dr.Match: calendário inicializado.");
    } catch (erro) {
        mostrarErro("Ocorreu um erro ao montar o calendário.");
        console.error(erro);
    }
});
