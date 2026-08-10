const CHAVE_CONFIGURACOES =
    "configuracoes";

const CHAVE_ACESSIBILIDADE = "acessibilidade";
const ACESSIBILIDADE_PADRAO = Object.freeze({
    tamanhoTexto: 100,
    fonteDislexia: false,
    altoContraste: false,
    temaEscuro: false,
    tema: "light",
    eyeTracking: false,
    daltonismo: "protanopia"
});

const SELETOR_TEXTOS = [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "span", "a", "button", "label", "input",
    "textarea", "select", "option", "li", "dt", "dd",
    "output", "small", "strong", "em", "address", "legend"
].join(",");

let escalaTextoAtual = 1;
let observadorTextos = null;
let mediaTema = null;
let ouvirTemaSistema = null;

export function listarConfiguracoes() {

    const configuracoes =
        localStorage.getItem(
            CHAVE_CONFIGURACOES
        );

    return configuracoes
        ? JSON.parse(configuracoes)
        : {};

}

export function obterConfiguracao(chave) {

    const configuracoes =
        listarConfiguracoes();

    return configuracoes[chave];

}

export function salvarConfiguracao(
    chave,
    valor
) {

    const configuracoes =
        listarConfiguracoes();

    configuracoes[chave] =
        valor;

    localStorage.setItem(
        CHAVE_CONFIGURACOES,
        JSON.stringify(
            configuracoes
        )
    );

}

export function removerConfiguracao(chave) {

    const configuracoes =
        listarConfiguracoes();

    delete configuracoes[chave];

    localStorage.setItem(
        CHAVE_CONFIGURACOES,
        JSON.stringify(
            configuracoes
        )
    );

}

export function limparConfiguracoes() {

    localStorage.removeItem(
        CHAVE_CONFIGURACOES
    );

}

export function existeConfiguracao(chave) {

    const configuracoes =
        listarConfiguracoes();

    return Object.prototype.hasOwnProperty.call(
        configuracoes,
        chave
    );

}

export function obterConfiguracoesAcessibilidade() {
    const salvas = obterConfiguracao(CHAVE_ACESSIBILIDADE) || {};
    const configuracoes = {
        ...ACESSIBILIDADE_PADRAO,
        ...salvas
    };

    if (salvas.tema === "system") {
        configuracoes.tema = "contrast";
    } else if (!Object.prototype.hasOwnProperty.call(salvas, "tema") && salvas.temaEscuro) {
        configuracoes.tema = "dark";
    }
    return configuracoes;
}

export function salvarConfiguracoesAcessibilidade(alteracoes) {
    const configuracoes = {
        ...obterConfiguracoesAcessibilidade(),
        ...alteracoes
    };

    salvarConfiguracao(CHAVE_ACESSIBILIDADE, configuracoes);
    return configuracoes;
}

export function redefinirConfiguracoesAcessibilidade() {
    const configuracoes = { ...ACESSIBILIDADE_PADRAO };
    salvarConfiguracao(CHAVE_ACESSIBILIDADE, configuracoes);
    return configuracoes;
}

function redimensionarElemento(elemento) {
    if (!(elemento instanceof HTMLElement)) return;

    if (!elemento.dataset.accessibilityBaseFontSize) {
        const tamanhoCalculado = Number.parseFloat(
            window.getComputedStyle(elemento).fontSize
        );

        if (!Number.isFinite(tamanhoCalculado)) return;
        elemento.dataset.accessibilityBaseFontSize = String(tamanhoCalculado);
    }

    const tamanhoBase = Number(
        elemento.dataset.accessibilityBaseFontSize
    );
    elemento.style.fontSize = `${tamanhoBase * escalaTextoAtual}px`;
}

function redimensionarTextos(container = document) {
    if (container instanceof HTMLElement && container.matches(SELETOR_TEXTOS)) {
        redimensionarElemento(container);
    }

    container.querySelectorAll?.(SELETOR_TEXTOS).forEach(redimensionarElemento);
}

function observarNovosTextos() {
    if (observadorTextos || !document.body) return;

    observadorTextos = new MutationObserver(registros => {
        registros.forEach(registro => {
            registro.addedNodes.forEach(no => {
                if (no instanceof HTMLElement) redimensionarTextos(no);
            });
        });
    });
    observadorTextos.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function aplicarTema(raiz, preferencias) {
    const temaSalvo = preferencias.tema || (preferencias.temaEscuro ? "dark" : "contrast");
    mediaTema ||= window.matchMedia("(prefers-color-scheme: dark)");

    if (ouvirTemaSistema) mediaTema.removeEventListener?.("change", ouvirTemaSistema);

    const atualizar = () => {
        const escuro = temaSalvo === "dark" || temaSalvo === "contrast";
        raiz.classList.toggle("accessibility-dark-theme", escuro);
        raiz.classList.toggle("accessibility-high-contrast", temaSalvo === "contrast");
        raiz.style.colorScheme = escuro ? "dark" : "light";
    };

    atualizar();
    ouvirTemaSistema = null;

    raiz.classList.toggle("accessibility-color-vision", temaSalvo === "color-vision");
    [
        "protanopia",
        "deuteranopia",
        "tritanopia",
        "protanomalia",
        "deuteranomalia",
        "tritanomalia",
        "acromatopsia"
    ].forEach(tipo => {
        raiz.classList.toggle(`accessibility-${tipo}`, temaSalvo === "color-vision" && preferencias.daltonismo === tipo);
    });
}

export function aplicarConfiguracoesAcessibilidade(configuracoes) {
    if (typeof document === "undefined") return;

    const preferencias = {
        ...ACESSIBILIDADE_PADRAO,
        ...configuracoes
    };
    const raiz = document.documentElement;

    escalaTextoAtual = preferencias.tamanhoTexto / 100;
    redimensionarTextos();
    observarNovosTextos();
    raiz.classList.toggle("accessibility-dyslexic-font", preferencias.fonteDislexia);
    aplicarTema(raiz, preferencias);

    raiz.classList.toggle("accessibility-eye-tracking", Boolean(preferencias.eyeTracking));
    window.dispatchEvent(new CustomEvent("ludos:accessibility-change", {
        detail: { ...preferencias }
    }));
}
