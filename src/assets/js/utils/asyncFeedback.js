const CHAVE_FEEDBACK = "ludos-feedback-pendente";
let temporizadorFeedback = null;

function garantirEstilosFeedback() {
    if (document.getElementById("async-feedback-styles")) return;

    const estilos = document.createElement("style");
    estilos.id = "async-feedback-styles";
    estilos.textContent = `
        .app-feedback-toast{position:fixed;z-index:3000;right:24px;bottom:24px;display:grid;width:min(390px,calc(100% - 32px));padding:17px 18px;grid-template-columns:34px minmax(0,1fr) 32px;align-items:center;gap:12px;border-radius:22px;background:#fff;color:#222;box-shadow:0 14px 45px rgba(0,0,0,.2);opacity:0;transform:translateY(18px);transition:opacity .25s ease,transform .25s ease}
        .app-feedback-toast.show{opacity:1;transform:translateY(0)}
        .app-feedback-icon{display:grid;width:34px;height:34px;place-items:center;border-radius:50%;background:#daf4e4;color:#147840;font-weight:800}
        .app-feedback-toast.error .app-feedback-icon{background:#fbe1e4;color:#a72b3a}
        .app-feedback-message{margin:0;font:600 14px/1.4 "DM Sans",sans-serif;overflow-wrap:anywhere}
        .app-feedback-close{display:grid;width:32px;height:32px;padding:0;place-items:center;border:0;border-radius:50%;background:#f0f0f2;color:#333;font-size:20px;cursor:pointer}
        .app-feedback-close:focus-visible{outline:3px solid #6b8cff;outline-offset:2px}
        @media(max-width:620px){.app-feedback-toast{right:16px;bottom:max(16px,env(safe-area-inset-bottom));padding:15px 16px}}
    `;
    document.head.append(estilos);
}

export function mostrarFeedbackGlobal(mensagem, tipo = "success", duracao = 4200) {
    garantirEstilosFeedback();
    document.querySelector(".app-feedback-toast")?.remove();
    clearTimeout(temporizadorFeedback);

    const toast = document.createElement("aside");
    toast.className = `app-feedback-toast ${tipo === "error" ? "error" : "success"}`;
    toast.setAttribute("role", tipo === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", tipo === "error" ? "assertive" : "polite");
    toast.setAttribute("aria-atomic", "true");

    const icone = document.createElement("span");
    icone.className = "app-feedback-icon";
    icone.setAttribute("aria-hidden", "true");
    icone.textContent = tipo === "error" ? "!" : "✓";

    const texto = document.createElement("p");
    texto.className = "app-feedback-message";
    texto.textContent = mensagem;

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "app-feedback-close";
    fechar.setAttribute("aria-label", "Fechar mensagem");
    fechar.textContent = "×";

    function remover() {
        clearTimeout(temporizadorFeedback);
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }

    fechar.addEventListener("click", remover);
    toast.append(icone, texto, fechar);
    document.body.append(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    temporizadorFeedback = setTimeout(remover, duracao);
    return toast;
}

export function salvarFeedbackNavegacao(mensagem, tipo = "success") {
    sessionStorage.setItem(CHAVE_FEEDBACK, JSON.stringify({ mensagem, tipo }));
}

export function exibirFeedbackPendente() {
    const feedback = sessionStorage.getItem(CHAVE_FEEDBACK);
    if (!feedback) return;
    sessionStorage.removeItem(CHAVE_FEEDBACK);

    try {
        const { mensagem, tipo } = JSON.parse(feedback);
        if (mensagem) mostrarFeedbackGlobal(mensagem, tipo);
    } catch {
        // Um valor inválido não deve interromper a inicialização da página.
    }
}

export function definirEstadoCarregando(elemento, carregando, mensagem = "Carregando...") {
    if (!elemento) return;
    elemento.setAttribute("aria-busy", String(carregando));
    if (carregando && !elemento.children.length) elemento.textContent = mensagem;
}

export function iniciarTratamentoErrosGlobais() {
    if (window.__ludosAsyncFeedbackAtivo) return;
    window.__ludosAsyncFeedbackAtivo = true;

    window.addEventListener("unhandledrejection", (event) => {
        const mensagem = event.reason?.message;
        mostrarFeedbackGlobal(
            mensagem || "Uma operação não pôde ser concluída. Tente novamente.",
            "error"
        );
    });

    window.addEventListener("offline", () => {
        mostrarFeedbackGlobal(
            "Você está sem conexão. Algumas ações ficarão indisponíveis até a internet voltar.",
            "error",
            6000
        );
    });

    window.addEventListener("online", () => {
        mostrarFeedbackGlobal("Conexão restabelecida.");
    });
}
