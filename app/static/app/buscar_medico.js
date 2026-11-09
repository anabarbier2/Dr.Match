
const formBusca = document.getElementById("formBusca");
const campoNome = document.getElementById("busca");
const campoEspecialidade = document.getElementById("especialidade");
const resultados = document.getElementById("resultados");
const mensagem = document.getElementById("mensagem");
const contador = document.getElementById("contador");

async function buscarMedicos() {
    resultados.replaceChildren();
    contador.textContent = "";
    mensagem.textContent = "Buscando médicos...";

    const nome = campoNome.value.trim();
    const especialidadeBusca = campoEspecialidade.value.trim();

    const parametros = new URLSearchParams({
        busca: nome,
        especialidade: especialidadeBusca
    });

    const pesquisando = Boolean(nome || especialidadeBusca);

    try {
        const resposta = await fetch(`/medicos/?${parametros.toString()}`);

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar os médicos.");
        }

        const medicos = await resposta.json();

        if (!Array.isArray(medicos)) {
            throw new Error("A resposta recebida não é válida.");
        }

        contador.textContent = `${medicos.length} encontrado(s)`;

        if (medicos.length === 0) {
            mensagem.textContent =
                "Nenhum médico encontrado. Experimente outros termos.";
            return;
        }

        mensagem.textContent = pesquisando
            ? "Confira os profissionais encontrados:"
            : "Conheça alguns dos profissionais cadastrados. Pesquise para encontrar outros médicos:";

        medicos.forEach((medico) => {
            const cartao = document.createElement("article");
            cartao.className = "medico-card";

            const nomeMedico = document.createElement("h3");
            nomeMedico.textContent = medico.nome;

            const especialidade = document.createElement("p");
            especialidade.className = "especialidade";
            especialidade.textContent =
                medico.especialidade || "Especialidade não informada";

            const crm = document.createElement("p");
            crm.className = "crm";
            crm.textContent = `CRM: ${medico.crm}`;

            const email = document.createElement("p");
            email.textContent = `Email: ${medico.email}`;

            const telefone = document.createElement("p");
            telefone.textContent =
                `Telefone: ${medico.telefone || "Não informado"}`;

            const convenio = document.createElement("p");
            convenio.className = "convenio";
            convenio.textContent =
                `Convênio: ${medico.convenio || "Não informado"}`;

            const botaoAgendar = document.createElement("a");
            botaoAgendar.className = "button button-primary";
            botaoAgendar.textContent = "Agendar";
            botaoAgendar.href = `/medicos/${medico.id}/perfil/`;

            cartao.append(
                nomeMedico,
                especialidade,
                crm,
                email,
                telefone,
                convenio,
                botaoAgendar
            );

            resultados.appendChild(cartao);
        });

    } catch (erro) {
        mensagem.textContent =
            "Não foi possível carregar os médicos. Tente novamente.";
        contador.textContent = "";
    }
}

formBusca.addEventListener("submit", (event) => {
    event.preventDefault();
    buscarMedicos();
});

buscarMedicos();
