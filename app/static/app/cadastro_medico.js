document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCadastro");
  const message = document.getElementById("mensagem");
  const nextButton = document.getElementById("botaoProximo");
  const backButton = document.getElementById("botaoVoltar");
  const submitButton = document.getElementById("botaoCadastrar");
  const cadastroView = document.getElementById("cadastroView");
  const successView = document.getElementById("sucessoView");

  const steps = [...document.querySelectorAll(".form-step")];
  const indicators = [...document.querySelectorAll("[data-step-indicator]")];

  let currentStep = 1;

  function showMessage(text, type = "error") {
    if (message) {
      message.textContent = text;
      message.className = `message ${type}`;
    }
  }

  function renderStep() {
    steps.forEach((section) => {
      section.classList.toggle(
        "active",
        Number(section.dataset.step) === currentStep
      );
    });

    indicators.forEach((indicator) => {
      const number = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle("active", number === currentStep);
      indicator.classList.toggle("completed", number < currentStep);
    });

    if (backButton) backButton.hidden = currentStep === 1;
    if (nextButton) nextButton.hidden = currentStep === 3;
    if (submitButton) submitButton.hidden = currentStep !== 3;
    if (message) message.textContent = "";
  }

  function validateCurrentStep() {
    const activeSection = steps.find(
      (section) => Number(section.dataset.step) === currentStep
    );

    if (!activeSection) return true;

    const requiredFields = [...activeSection.querySelectorAll("[required]")];

    for (const field of requiredFields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    return true;
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (!validateCurrentStep()) return;

      currentStep = Math.min(3, currentStep + 1);
      renderStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      currentStep = Math.max(1, currentStep - 1);
      renderStep();
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validateCurrentStep()) return;

      // Busca o token gerado pelo {% csrf_token %} do Django.
      const csrfInput = form.querySelector('[name="csrfmiddlewaretoken"]');
      const token = csrfInput?.value.trim();

      if (!token) {
        showMessage(
          "Token CSRF não encontrado. Atualize a página e tente novamente."
        );
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";
      }
      if (message) message.textContent = "";

      const formData = new FormData(form);
      const allData = Object.fromEntries(formData.entries());

      // Campos atualmente aceitos pela API do projeto.
      
      
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
          if (response.status === 403) {
            showMessage(
              "O Django recusou o token CSRF. Atualize a página e tente novamente."
            );
          } else {
            const errors = result.errors || result;
            const messages = Object.values(errors)
              .flat()
              .map((error) =>
                typeof error === "string" ? error : error?.message || ""
              )
              .filter(Boolean);

            showMessage(
              messages.join(" ") ||
                result.erro ||
                result.error ||
                `Falha no cadastro (HTTP ${response.status}).`
            );
          }

          return;
        }

        // Exibe sucesso somente após resposta HTTP de sucesso da API.
        if (cadastroView) cadastroView.hidden = true;
        if (successView) successView.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });

      } catch (error) {
        console.error("Erro ao cadastrar médico:", error);

        showMessage(
          "Não foi possível conectar à API. Confira se o servidor Django está ligado."
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Concluir cadastro";
        }
      }
    });
  }

  renderStep();
});