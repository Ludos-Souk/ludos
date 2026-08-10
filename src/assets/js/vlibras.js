(function inicializarVLibras() {
    const ID_CONTAINER = "vlibras-container";
    const ID_SCRIPT = "vlibras-plugin-script";
    const URL_PLUGIN = "https://vlibras.gov.br/app/vlibras-plugin.js";
    const URL_WIDGET = "https://vlibras.gov.br/app";

    function criarContainer() {
        if (document.getElementById(ID_CONTAINER)) return;

        const container = document.createElement("div");
        container.id = ID_CONTAINER;
        container.setAttribute("vw", "");
        container.className = "enabled";
        container.innerHTML = `
            <div vw-access-button class="active"></div>
            <div vw-plugin-wrapper>
                <div class="vw-plugin-top-wrapper"></div>
            </div>
        `;
        document.body.appendChild(container);
    }

    function criarWidget() {
        if (!window.VLibras?.Widget || window.__ludosVLibrasInicializado) return;
        window.__ludosVLibrasInicializado = true;
        new window.VLibras.Widget(URL_WIDGET);
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
        criarContainer();
        carregarPlugin();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
