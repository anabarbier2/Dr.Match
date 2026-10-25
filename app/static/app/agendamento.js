
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAgendamento");
    const campoMedico = document.getElementById("medico");
    const campoData = document.getElementById("data");
    const campoHorario = document.getElementById("horario");
    const campoMensagem = document.getElementById("mensagem");
    const botaoEnviar = document.getElementById("botaoEnviar");

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

    const hoje = new Date();
    const dataLocal = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, "0"),
        String(hoje.getDate()).padStart(2, "0")
    ].join("-");

    campoData.min = dataLocal;

    function mostrarMensagem(texto, tipo = "") {
        campoMensagem.textContent = texto;
        campoMensagem.className = `message ${tipo}`;
    }

    function definirOpcaoInicial(select, texto) {
        select.replaceChildren(new Option(texto, ""));
    }

    async function carregarMedicos() {
        definirOpcaoInicial(campoMedico, "Carregando médicos...");

        try {
            const parametros = new URLSearchParams(window.location.search);
            const medicoSelecionado = parametros.get("medico");

            if (
                medicoSelecionado &&
                [...campoMedico.options].some((opcao) => opcao.value === medicoSelecionado)) {
                campoMedico.value = medicoSelecionado;
                campoMedico.disabled = true;}

            const resposta = await fetch("/medicos/");
            if (!resposta.ok) {
                throw new Error("Não foi possível buscar os médicos.");
            }

            const medicos = await resposta.json();

            definirOpcaoInicial(campoMedico, "Selecione um médico");

            medicos.forEach((medico) => {
                const opcao = new Option(
                    `${medico.nome} — ${medico.especialidade}`,
                    medico.id
                );
                campoMedico.add(opcao);
            });

            if (medicos.length === 0) {
                definirOpcaoInicial(
                    campoMedico,
                    "Nenhum médico cadastrado"
                );
            }
        } catch (erro) {
            definirOpcaoInicial(
                campoMedico,
                "Erro ao carregar médicos"
            );
            mostrarMensagem(
                "Não foi possível carregar os médicos. Atualize a página e tente novamente.",
                "error"
            );
        }
    }

    async function carregarHorarios() {
        definirOpcaoInicial(campoHorario, "Carregando horários...");
        campoHorario.disabled = true;

        const medico = campoMedico.value;
        const data = campoData.value;

        if (!medico || !data) {
            definirOpcaoInicial(
                campoHorario,
                "Selecione primeiro o médico e a data"
            );
            return;
        }

        if (data < dataLocal) {
            definirOpcaoInicial(
                campoHorario,
                "Escolha uma data válida"
            );
            mostrarMensagem("Não é possível selecionar uma data passada.", "error");
            return;
        }

        try {
            const parametros = new URLSearchParams({ medico, data });
            const resposta = await fetch(
                `/agendamentos/horarios-ocupados/?${parametros}`
            );
            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || "Erro ao consultar horários.");
            }

            const ocupados = resultado.horarios_ocupados || [];
            const agora = new Date();
            const dataHoje = data === dataLocal;
            const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

            definirOpcaoInicial(campoHorario, "Selecione um horário");

            let quantidade = 0;

            horariosPossiveis.forEach((horario) => {
                const [hora, minuto] = horario.split(":").map(Number);
                const minutosHorario = hora * 60 + minuto;

                if (ocupados.includes(horario)) {
                    return;
                }

                if (dataHoje && minutosHorario <= minutosAgora) {
                    return;
                }

                campoHorario.add(new Option(horario, horario));
                quantidade++;
            });

            if (quantidade === 0) {
                definirOpcaoInicial(
                    campoHorario,
                    "Nenhum horário disponível nesta data"
                );
                mostrarMensagem(
                    "Não há horários disponíveis para esta data. Tente outro dia.",
                    "error"
                );
                return;
            }

            campoHorario.disabled = false;
            mostrarMensagem("");
        } catch (erro) {
            definirOpcaoInicial(
                campoHorario,
                "Não foi possível carregar os horários"
            );
            mostrarMensagem(
                erro.message || "Erro ao consultar os horários.",
                "error"
            );
        }
    }

    campoMedico.addEventListener("change", carregarHorarios);
    campoData.addEventListener("change", carregarHorarios);

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        mostrarMensagem("");

        if (!form.reportValidity()) {
            return;
        }

        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "Enviando solicitação...";

        const dados = {
            nome: document.getElementById("nome").value.trim(),
            email: document.getElementById("email").value.trim(),
            telefone: document.getElementById("telefone").value.trim(),
            medico: campoMedico.value,
            data: campoData.value,
            horario: campoHorario.value
        };

        const csrf = form.querySelector(
            "[name=csrfmiddlewaretoken]"
        )?.value;

        try {
            const resposta = await fetch("/agendamentos/criar/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro ||
                    resultado.mensagem ||
                    "Não foi possível registrar o pedido."
                );
            }

            mostrarMensagem(
                resultado.mensagem ||
                "Pré-agendamento solicitado! Entre em contato com o médico para confirmar sua consulta.",
                "success"
            );

            form.reset();
            campoData.min = dataLocal;
            definirOpcaoInicial(campoHorario, "Selecione primeiro o médico e a data");
            campoHorario.disabled = true;

            // Atualiza a lista de horários para o caso de novo pedido.
            await carregarHorarios();
        } catch (erro) {
            mostrarMensagem(
                erro.message || "Erro ao enviar a solicitação.",
                "error"
            );
        } finally {
            botaoEnviar.disabled = false;
            botaoEnviar.textContent = "Solicitar pré-agendamento";
        }
    });

    carregarMedicos();
});
