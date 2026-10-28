
document.addEventListener("DOMContentLoaded", () => {
    const main = document.querySelector("main");

    if (!main) return;

    main.classList.add("perfil-medico");

    const section = main.querySelector(".perfil-conteudo");

    if (section) {
        section.querySelectorAll(".info-card").forEach((card, index) => {
            card.style.animationDelay = `${index * 80}ms`;
        });
    }
});
