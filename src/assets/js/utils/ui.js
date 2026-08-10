import { mostrarFeedbackGlobal } from "./asyncFeedback.js";

const botoesVozConfigurados = new WeakSet();

export function debounce(callback, espera = 250) {
    let temporizador;

    return (...argumentos) => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => callback(...argumentos), espera);
    };
}

export function criarEstadoInterface(mensagem, classe = "", tipo = "status") {
    const elemento = document.createElement("p");
    elemento.className = classe;
    elemento.textContent = mensagem;
    elemento.setAttribute("role", tipo === "error" ? "alert" : "status");
    elemento.setAttribute("aria-live", tipo === "error" ? "assertive" : "polite");
    return elemento;
}

export function substituirPorEstado(container, mensagem, classe = "", tipo = "status") {
    if (!container) return null;
    const estado = criarEstadoInterface(mensagem, classe, tipo);
    container.replaceChildren(estado);
    return estado;
}

export function configurarPesquisaCabecalho({
    formulario = document.querySelector(".search-form"),
    input = document.getElementById("search-input"),
    botaoVoz = document.querySelector(".mic-btn"),
    aoPesquisar,
    pesquisarAoDigitar = false,
    espera = 250
} = {}) {
    if (!input || typeof aoPesquisar !== "function") return;

    const pesquisar = (valor) => {
        const termo = String(valor || "").trim();
        aoPesquisar(termo);
    };

    formulario?.addEventListener("submit", (event) => {
        event.preventDefault();
        pesquisar(input.value);
    });

    if (pesquisarAoDigitar) {
        input.addEventListener("input", debounce(() => pesquisar(input.value), espera));
    }

    if (!botaoVoz) return;
    if (botoesVozConfigurados.has(botaoVoz)) return;
    botoesVozConfigurados.add(botaoVoz);
    botaoVoz.setAttribute("aria-pressed", "false");

    const statusVoz = document.createElement("span");
    statusVoz.className = "sr-only voice-search-status";
    statusVoz.setAttribute("role", "status");
    statusVoz.setAttribute("aria-live", "polite");
    formulario?.append(statusVoz);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        botaoVoz.disabled = true;
        botaoVoz.title = "Pesquisa por voz indisponível neste navegador";
        botaoVoz.setAttribute("aria-disabled", "true");
        statusVoz.textContent = "Pesquisa por voz indisponível neste navegador.";
        return;
    }

    const reconhecimento = new SpeechRecognition();
    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;
    reconhecimento.maxAlternatives = 1;
    let ouvindo = false;

    reconhecimento.onstart = () => {
        botaoVoz.classList.add("listening");
        botaoVoz.setAttribute("aria-label", "Ouvindo pesquisa por voz");
        botaoVoz.setAttribute("aria-pressed", "true");
        statusVoz.textContent = "Ouvindo. Diga o nome do produto que deseja buscar.";
        ouvindo = true;
    };

    reconhecimento.onresult = (event) => {
        const texto = event.results?.[0]?.[0]?.transcript?.trim() || "";
        input.value = texto;
        statusVoz.textContent = texto
            ? `Texto reconhecido: ${texto}.`
            : "Nenhum texto foi reconhecido.";
        pesquisar(texto);
    };

    reconhecimento.onend = () => {
        botaoVoz.classList.remove("listening");
        botaoVoz.setAttribute("aria-label", "Pesquisar por voz");
        botaoVoz.setAttribute("aria-pressed", "false");
        ouvindo = false;
    };

    reconhecimento.onerror = ({ error }) => {
        const mensagens = {
            "not-allowed": "Permita o acesso ao microfone para utilizar a pesquisa por voz.",
            "service-not-allowed": "A pesquisa por voz foi bloqueada pelo navegador.",
            "audio-capture": "Nenhum microfone disponível foi encontrado.",
            "no-speech": "Nenhuma fala foi detectada. Tente novamente mais perto do microfone.",
            "network": "A pesquisa por voz está indisponível por uma falha de conexão.",
            "aborted": "Pesquisa por voz cancelada."
        };
        const mensagem = mensagens[error] || "Não foi possível reconhecer sua voz. Tente novamente.";
        statusVoz.textContent = mensagem;
        if (error !== "aborted") mostrarFeedbackGlobal(mensagem, "error");
    };

    botaoVoz.addEventListener("click", () => {
        if (ouvindo) {
            reconhecimento.abort();
            return;
        }
        try {
            reconhecimento.start();
        } catch {
            mostrarFeedbackGlobal("A pesquisa por voz já está em andamento.", "error");
        }
    });

    botaoVoz.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && ouvindo) reconhecimento.abort();
    });
}
