const CHAVE_CONFIGURACOES =
    "configuracoes";

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