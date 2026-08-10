const SELETOR_IMAGEM_PRIORITARIA = ".logo img, img.logo, .footer-logo, [data-image-priority]";

export function otimizarImagem(imagem) {
    if (!(imagem instanceof HTMLImageElement)) return;

    imagem.decoding = "async";
    if (!imagem.matches(SELETOR_IMAGEM_PRIORITARIA) && !imagem.closest("header")) {
        imagem.loading = "lazy";
    }
}

export function iniciarOtimizacaoImagens(raiz = document) {
    raiz.querySelectorAll("img").forEach(otimizarImagem);

    const observador = new MutationObserver((mudancas) => {
        mudancas.forEach(({ addedNodes }) => {
            addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                if (node.matches("img")) otimizarImagem(node);
                node.querySelectorAll?.("img").forEach(otimizarImagem);
            });
        });
    });

    observador.observe(document.body, { childList: true, subtree: true });
    return observador;
}
