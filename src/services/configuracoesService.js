const CHAVE_CONFIGURACOES =
    "configuracoes";

const CHAVE_ACESSIBILIDADE = "acessibilidade";
const ACESSIBILIDADE_PADRAO = Object.freeze({
    tamanhoTexto: 100,
    fonteDislexia: false,
    altoContraste: false,
    temaEscuro: false
});

const SELETOR_TEXTOS = [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "span", "a", "button", "label", "input",
    "textarea", "select", "option", "li", "dt", "dd",
    "output", "small", "strong", "em", "address", "legend"
].join(",");

let escalaTextoAtual = 1;
let observadorTextos = null;

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
    return {
        ...ACESSIBILIDADE_PADRAO,
        ...(obterConfiguracao(CHAVE_ACESSIBILIDADE) || {})
    };
}

export function salvarConfiguracoesAcessibilidade(alteracoes) {
    const configuracoes = {
        ...obterConfiguracoesAcessibilidade(),
        ...alteracoes
    };

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
    raiz.classList.toggle("accessibility-high-contrast", preferencias.altoContraste);
    raiz.classList.toggle("accessibility-dark-theme", preferencias.temaEscuro);
    raiz.style.colorScheme = preferencias.temaEscuro ? "dark" : "light";
}
