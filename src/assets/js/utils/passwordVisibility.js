function criarIcone(oculta) {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    const caminhos = oculta
        ? [
            ["path", { d: "M2.06 12.35a1 1 0 0 1 0-.7C3.73 7.6 7.64 5 12 5c4.36 0 8.27 2.6 9.94 6.65a1 1 0 0 1 0 .7C20.27 16.4 16.36 19 12 19c-4.36 0-8.27-2.6-9.94-6.65" }],
            ["circle", { cx: "12", cy: "12", r: "3" }]
        ]
        : [
            ["path", { d: "m2 2 20 20" }],
            ["path", { d: "M6.71 6.71C4.91 7.91 3.52 9.6 2.69 11.65a1 1 0 0 0 0 .7C4.36 16.4 8.27 19 12.63 19c1.08 0 2.12-.16 3.09-.46" }],
            ["path", { d: "M10.73 5.08C11.15 5.03 11.57 5 12 5c4.36 0 8.27 2.6 9.94 6.65a1 1 0 0 1 0 .7 11.06 11.06 0 0 1-2.1 3.28" }],
            ["path", { d: "M14.12 14.12A3 3 0 0 1 9.88 9.88" }]
        ];

    caminhos.forEach(([tag, atributos]) => {
        const elemento = document.createElementNS(namespace, tag);
        Object.entries(atributos).forEach(([nome, valor]) => elemento.setAttribute(nome, valor));
        svg.append(elemento);
    });
    return svg;
}

export function inicializarVisibilidadeSenhas(escopo = document) {
    escopo.querySelectorAll('input[type="password"]').forEach(input => {
        if (input.dataset.passwordToggle === "true") return;
        const grupo = input.closest(".input-group");
        if (!grupo) return;

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "password-toggle";
        botao.setAttribute("aria-controls", input.id);
        botao.setAttribute("aria-label", "Mostrar senha");
        botao.setAttribute("aria-pressed", "false");
        botao.append(criarIcone(true));

        botao.addEventListener("click", () => {
            const mostrar = input.type === "password";
            const inicioSelecao = input.selectionStart;
            const fimSelecao = input.selectionEnd;
            input.type = mostrar ? "text" : "password";
            botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
            botao.setAttribute("aria-pressed", String(mostrar));
            botao.replaceChildren(criarIcone(!mostrar));
            input.focus({ preventScroll: true });
            if (inicioSelecao !== null && fimSelecao !== null) input.setSelectionRange(inicioSelecao, fimSelecao);
        });

        input.dataset.passwordToggle = "true";
        grupo.append(botao);
    });
}
