document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAgendamento");
    const campoNome = document.getElementById("nome");
    const campoEmail = document.getElementById("email");
    const campoTelefone = document.getElementById("telefone");
    const campoMedico = document.getElementById("medico");
    const campoData = document.getElementById("data");
    const campoHorario = document.getElementById("horario");
    const campoMensagem = document.getElementById("mensagem");
    const botaoEnviar = document.getElementById("botaoEnviar");

    // Evita erros caso algum elemento obrigatório não esteja no HTML.
    if (
        !form || !campoNome || !campoEmail || !campoTelefone ||
        !campoMedico || !campoData || !campoHorario ||
        !campoMensagem || !botaoEnviar
    ) {
        console.error(
            "Dr.Match: confira os IDs dos campos em agendamento.html."
        );
        return;
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

    const parametros = new URLSearchParams(window.location.search);
    const medicoDaURL = parametros.get("medico");
    const dataDaURL = parametros.get("data");
    const horarioDaURL = parametros.get("horario");

    function dataLocalISO() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    const hojeISO = dataLocalISO();
    campoData.min = hojeISO;

    function mostrarMensagem(texto, tipo = "") {
        campoMensagem.textContent = texto;
        campoMensagem.className = `message ${tipo}`;
    }

    function definirOpcaoInicial(select, texto) {
        select.replaceChildren(new Option(texto, ""));
    }

    async function lerResposta(resposta) {
        const texto = await resposta.text();

        try {
            return texto ? JSON.parse(texto) : {};
        } catch {
            throw new Error(
                "O servidor retornou uma resposta inválida. Confira o terminal do Django."
            );
        }
    }

    async function carregarMedicos() {
        campoMedico.disabled = false;
        definirOpcaoInicial(campoMedico, "Carregando médicos...");

        try {
            const resposta = await fetch("/medicos/");
            const resultado = await lerResposta(resposta);

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível buscar os médicos."
                );
            }

            definirOpcaoInicial(campoMedico, "Selecione um médico");

            resultado.forEach((medico) => {
                campoMedico.add(
                    new Option(
                        `${medico.nome} — ${medico.especialidade}`,
                        String(medico.id)
                    )
                );
            });

            if (resultado.length === 0) {
                definirOpcaoInicial(
                    campoMedico,
                    "Nenhum médico cadastrado"
                );
                mostrarMensagem(
                    "Não há médicos cadastrados no sistema.",
                    "error"
                );
                return;
            }

            if (medicoDaURL) {
                const existe = [...campoMedico.options].some(
                    (opcao) => opcao.value === medicoDaURL
                );

                if (existe) {
                    campoMedico.value = medicoDaURL;
                    campoMedico.disabled = true;
                } else {
                    mostrarMensagem(
                        "O médico selecionado não foi encontrado.",
                        "error"
                    );
                }
            }

            if (dataDaURL && /^\d{4}-\d{2}-\d{2}$/.test(dataDaURL)) {
                if (dataDaURL >= hojeISO) {
                    campoData.value = dataDaURL;
                } else {
                    mostrarMensagem(
                        "A data selecionada já passou. Escolha outra data.",
                        "error"
                    );
                }
            }

            await carregarHorarios();
        } catch (erro) {
            definirOpcaoInicial(
                campoMedico,
                "Erro ao carregar médicos"
            );
            campoMedico.disabled = true;
            mostrarMensagem(
                erro.message || "Não foi possível carregar os médicos.",
                "error"
            );
        }
    }

    async function carregarHorarios() {
        campoHorario.disabled = true;
        definirOpcaoInicial(
            campoHorario,
            "Selecione primeiro o médico e a data"
        );

        const medico = campoMedico.value;
        const data = campoData.value;

        if (!medico || !data) {
            return;
        }

        if (data < hojeISO) {
            definirOpcaoInicial(campoHorario, "Escolha uma data válida");
            mostrarMensagem(
                "Não é possível selecionar uma data passada.",
                "error"
            );
            return;
        }

        try {
            const consulta = new URLSearchParams({ medico, data });
            const resposta = await fetch(
                `/agendamentos/horarios-ocupados/?${consulta}`
            );
            const resultado = await lerResposta(resposta);

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro || "Não foi possível consultar os horários."
                );
            }

            const ocupados = resultado.horarios_ocupados || [];
            const agora = new Date();
            const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

            definirOpcaoInicial(campoHorario, "Selecione um horário");

            let quantidade = 0;

            horariosPossiveis.forEach((horario) => {
                if (ocupados.includes(horario)) {
                    return;
                }

                const [hora, minuto] = horario.split(":").map(Number);

                if (
                    data === hojeISO &&
                    hora * 60 + minuto <= minutosAgora
                ) {
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
                    "Não há horários disponíveis para essa data. Escolha outro dia.",
                    "error"
                );
                return;
            }

            // Preenche o horário que veio do calendário, se ainda estiver livre.
            if (
                horarioDaURL &&
                [...campoHorario.options].some(
                    (opcao) => opcao.value === horarioDaURL
                )
            ) {
                campoHorario.value = horarioDaURL;
            }

            campoHorario.disabled = false;
            mostrarMensagem("");
        } catch (erro) {
            definirOpcaoInicial(
                campoHorario,
                "Erro ao carregar horários"
            );
            mostrarMensagem(
                erro.message || "Não foi possível carregar os horários.",
                "error"
            );
        }
    }

    campoMedico.addEventListener("change", carregarHorarios);
    campoData.addEventListener("change", carregarHorarios);

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (botaoEnviar.disabled) {
            return;
        }

        mostrarMensagem("");

        if (!form.reportValidity()) {
            return;
        }

        if (!campoMedico.value || !campoData.value || !campoHorario.value) {
            mostrarMensagem(
                "Selecione o médico, a data e um horário disponível.",
                "error"
            );
            return;
        }

        const dados = {
            nome: campoNome.value.trim(),
            email: campoEmail.value.trim(),
            telefone: campoTelefone.value.trim(),
            medico: campoMedico.value,
            data: campoData.value,
            horario: campoHorario.value
        };

        const csrf = form.querySelector(
            "[name=csrfmiddlewaretoken]"
        )?.value;

        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "Enviando solicitação...";

        try {
            const resposta = await fetch("/agendamentos/criar/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrf || ""
                },
                body: JSON.stringify(dados)
            });

            const resultado = await lerResposta(resposta);

            if (!resposta.ok) {
                throw new Error(
                    resultado.erro ||
                    resultado.mensagem ||
                    "Não foi possível registrar o pré-agendamento."
                );
            }

            mostrarMensagem(
                resultado.mensagem ||
                "Pré-agendamento solicitado com sucesso!",
                "success"
            );

            // Atualiza os horários: o horário recém-solicitado deve desaparecer.
            await carregarHorarios();

            form.reset();
            campoData.min = dataLocalISO();

            // Mantém o médico selecionado quando veio do perfil.
            if (medicoDaURL) {
                campoMedico.value = medicoDaURL;
                campoMedico.disabled = true;
            }

            campoHorario.disabled = true;
            definirOpcaoInicial(
                campoHorario,
                "Selecione primeiro o médico e a data"
            );
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