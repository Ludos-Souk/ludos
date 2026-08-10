function criarIconeX() {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("aria-hidden", "true");

    ["M18 6 6 18", "m6 6 12 12"].forEach(d => {
        const caminho = document.createElementNS(namespace, "path");
        caminho.setAttribute("d", d);
        svg.append(caminho);
    });
    return svg;
}

export function inicializarBotoesLimpar(escopo = document) {
    escopo.querySelectorAll(".input-group input").forEach(input => {
        if (input.dataset.clearButton === "true") return;
        const grupo = input.closest(".input-group");
        if (!grupo) return;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "input-clear";
        botao.setAttribute("aria-label", `Limpar campo ${input.name || input.id}`);
        botao.setAttribute("aria-controls", input.id);
        botao.append(criarIconeX());

        const atualizarVisibilidade = () => {
            botao.hidden = input.value.length === 0;
        };

        botao.addEventListener("click", () => {
            input.value = "";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.focus({ preventScroll: true });
        });
        input.addEventListener("input", atualizarVisibilidade);
        input.addEventListener("focus", atualizarVisibilidade);

        input.dataset.clearButton = "true";
        grupo.append(botao);
        atualizarVisibilidade();
        setTimeout(atualizarVisibilidade, 100);
    });
}
