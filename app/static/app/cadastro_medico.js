
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formCadastro");
    const message = document.getElementById("mensagem");
    const nextButton = document.getElementById("botaoProximo");
    const backButton = document.getElementById("botaoVoltar");
    const submitButton = document.getElementById("botaoCadastrar");

    const steps = [...document.querySelectorAll(".form-step")];
    const indicators = [
        ...document.querySelectorAll("[data-step-indicator]")
    ];

    let currentStep = 1;

    function showMessage(text, type = "error") {
        if (message) {
            message.textContent = text;
            message.className = `message ${type}`;
        }
    }

    function renderStep() {
        steps.forEach(section => {
            section.classList.toggle(
                "active",
                Number(section.dataset.step) === currentStep
            );
        });

        indicators.forEach(indicator => {
            const number = Number(indicator.dataset.stepIndicator);

            indicator.classList.toggle("active", number === currentStep);
            indicator.classList.toggle("completed", number < currentStep);
        });

        if (backButton) {
            backButton.hidden = currentStep === 1;
        }

        if (nextButton) {
            nextButton.hidden = currentStep === 3;
        }

        if (submitButton) {
            submitButton.hidden = currentStep !== 3;
        }

        if (message) {
            message.textContent = "";
        }
    }

    function validateCurrentStep() {
        const activeSection = steps.find(
            section => Number(section.dataset.step) === currentStep
        );

        if (!activeSection) return true;

        const fields = [
            ...activeSection.querySelectorAll("[required]")
        ];

        for (const field of fields) {
            if (!field.checkValidity()) {
                field.reportValidity();
                return false;
            }
        }

        return true;
    }

    // Avançar etapas
    nextButton?.addEventListener("click", () => {
        if (!validateCurrentStep()) return;

        currentStep = Math.min(3, currentStep + 1);
        renderStep();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // Voltar etapas
    backButton?.addEventListener("click", () => {
        currentStep = Math.max(1, currentStep - 1);
        renderStep();
    });

    // Enviar cadastro
    form?.addEventListener("submit", async event => {
        event.preventDefault();

        if (!validateCurrentStep()) return;

        const csrfInput = form.querySelector(
            '[name="csrfmiddlewaretoken"]'
        );

        const token = csrfInput?.value.trim();

        if (!token) {
            showMessage(
                "Token CSRF não encontrado. Atualize a página."
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";

        const formData = new FormData(form);
        const allData = Object.fromEntries(formData.entries());

        const apiData = {
            nome: (allData.nome || "").trim(),
            crm: (allData.crm || "").trim().toUpperCase(),
            estado_crm: (allData.estado_crm || "").trim().toUpperCase(),
            especialidade: (allData.especialidade || "").trim(),
            email: (allData.email || "").trim(),
            telefone: (allData.telefone || "").trim(),
            cidade: (allData.cidade || "").trim(),
            estado: (allData.estado || "").trim().toUpperCase(),
            biografia: (allData.biografia || "").trim(),
            tipo_atendimento: (allData.tipo_atendimento || "").trim(),
            convenio: (allData.convenio || "").trim(),
            endereco: (allData.endereco || "").trim(),
            plano: (allData.plano || "").trim()
        };

        try {
            const response = await fetch("/medicos/", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": token
                },
                body: JSON.stringify(apiData)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errors = result.errors || result;

                const messages = Object.values(errors)
                    .flat()
                    .map(error =>
                        typeof error === "string"
                            ? error
                            : error?.message || ""
                    )
                    .filter(Boolean);

                showMessage(
                    messages.join(" ") ||
                    result.erro ||
                    `Erro ao cadastrar (HTTP ${response.status}).`
                );

                return;
            }

            // Verifica se o Django devolveu o ID.
            if (!result.id) {
                showMessage(
                    "Cadastro recebido, mas o ID do médico não foi retornado."
                );
                return;
            }

            // Impede a exibição da tela antiga de sucesso.
            const cadastroView = document.getElementById("cadastroView");
            const sucessoView = document.getElementById("sucessoView");

            if (sucessoView) {
                sucessoView.hidden = true;
            }

            if (cadastroView) {
                cadastroView.hidden = true;
            }

            // Abre a página de pagamento demonstrativo.
            window.location.assign(`/pagamento/${result.id}/`);

        } catch (error) {
            console.error("Erro ao cadastrar:", error);

            showMessage(
                "Não foi possível conectar ao servidor Django."
            );

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Concluir cadastro";
        }
    });

    renderStep();
});
