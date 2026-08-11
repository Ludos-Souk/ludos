(function inicializarVLibras() {
    const ID_CONTAINER = "vlibras-container";
    const ID_SCRIPT = "vlibras-plugin-script";
    const ID_ESTILOS = "vlibras-ludos-styles";
    const CHAVE_POSICAO = "ludos-vlibras-native-position";
    const URL_PLUGIN = "https://vlibras.gov.br/app/vlibras-plugin.js";
    const POSICAO_PADRAO = "L";
    const POSICOES_VALIDAS = ["L", "R", "T", "B"];
    const POSICAO_POR_TECLA = Object.freeze({
        ArrowLeft: "L",
        ArrowRight: "R",
        ArrowUp: "T",
        ArrowDown: "B"
    });

    let observadorDialogos = null;

    function obterPosicaoSalva() {
        const posicao = localStorage.getItem(CHAVE_POSICAO);
        return POSICOES_VALIDAS.includes(posicao) ? posicao : POSICAO_PADRAO;
    }

    function salvarEAplicarPosicao(posicao) {
        if (!POSICOES_VALIDAS.includes(posicao)) return;

        localStorage.setItem(CHAVE_POSICAO, posicao);
        window.dispatchEvent(new CustomEvent("vp-widget-wrapper-set-side", {
            detail: posicao
        }));
    }

    function criarEstilos() {
        if (document.getElementById(ID_ESTILOS)) return;

        const estilos = document.createElement("style");
        estilos.id = ID_ESTILOS;
        estilos.textContent = `
            #${ID_CONTAINER},
            #${ID_CONTAINER}[popover]:popover-open,
            #${ID_CONTAINER} [vw-access-button],
            #${ID_CONTAINER} [vw-plugin-wrapper] {
                z-index: 2147483647 !important;
            }

            #${ID_CONTAINER}[popover] {
                padding: 0 !important;
                overflow: visible !important;
                border: 0 !important;
                background: transparent !important;
                color: inherit !important;
            }
        `;
        document.head.appendChild(estilos);
    }

    function promoverParaCamadaSuperior(container) {
        if (!container || typeof container.showPopover !== "function") return;

        try {
            if (container.matches(":popover-open")) container.hidePopover();
            container.showPopover();
        } catch (erro) {
            console.debug("Não foi possível elevar o VLibras acima do popup.", erro);
        }
    }

    function observarAberturaDeDialogos(container) {
        if (observadorDialogos || !document.body) return;

        const promoverDepoisDoDialogo = () => {
            requestAnimationFrame(() => promoverParaCamadaSuperior(container));
        };

        observadorDialogos = new MutationObserver(registros => {
            const alterouDialogo = registros.some(
                registro => registro.target instanceof HTMLDialogElement
            );
            if (alterouDialogo) promoverDepoisDoDialogo();
        });
        observadorDialogos.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: ["open"]
        });

        document.addEventListener("close", promoverDepoisDoDialogo, true);
        document.addEventListener("cancel", promoverDepoisDoDialogo, true);
    }

    function alvoEhCampoDeEntrada(alvo) {
        return alvo instanceof HTMLElement && (
            alvo.matches("input, textarea, select") ||
            alvo.isContentEditable
        );
    }

    function configurarAtalhos() {
        document.addEventListener("keydown", evento => {
            const posicao = POSICAO_POR_TECLA[evento.key];
            if (!evento.ctrlKey || evento.altKey || evento.metaKey || !posicao) return;
            if (alvoEhCampoDeEntrada(evento.target)) return;

            evento.preventDefault();
            salvarEAplicarPosicao(posicao);
        });
    }

    function criarContainer() {
        const existente = document.getElementById(ID_CONTAINER);
        if (existente) return existente;

        const container = document.createElement("div");
        container.id = ID_CONTAINER;
        container.setAttribute("vw", "");
        container.setAttribute("popover", "manual");
        container.className = "enabled";

        const botaoAcesso = document.createElement("div");
        botaoAcesso.setAttribute("vw-access-button", "");
        botaoAcesso.className = "active";
        botaoAcesso.title = "VLibras — Ctrl + setas muda sua posição";

        const wrapper = document.createElement("div");
        wrapper.setAttribute("vw-plugin-wrapper", "");

        const wrapperSuperior = document.createElement("div");
        wrapperSuperior.className = "vw-plugin-top-wrapper";

        wrapper.append(wrapperSuperior);
        container.append(botaoAcesso, wrapper);
        document.body.prepend(container);
        return container;
    }

    function criarWidget() {
        if (!window.VLibras?.Widget || window.__ludosVLibrasInicializado) return;

        window.__ludosVLibrasInicializado = true;
        new window.VLibras.Widget({
            position: obterPosicaoSalva()
        });

        const container = document.getElementById(ID_CONTAINER);
        requestAnimationFrame(() => promoverParaCamadaSuperior(container));
    }

    function carregarPlugin() {
        const scriptExistente = document.getElementById(ID_SCRIPT);

        if (scriptExistente) {
            if (window.VLibras?.Widget) criarWidget();
            else scriptExistente.addEventListener("load", criarWidget, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.id = ID_SCRIPT;
        script.src = URL_PLUGIN;
        script.async = true;
        script.addEventListener("load", criarWidget, { once: true });
        script.addEventListener("error", () => {
            console.warn("Não foi possível carregar o recurso de acessibilidade VLibras.");
        }, { once: true });
        document.head.appendChild(script);
    }

    function iniciar() {
        criarEstilos();
        const container = criarContainer();
        configurarAtalhos();
        promoverParaCamadaSuperior(container);
        observarAberturaDeDialogos(container);
        carregarPlugin();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
