const CHAVE = "favoritos";

export function toggleFavorito(produtoId) {
    if (ehFavorito(produtoId)) {
        removerFavorito(produtoId)
    } else {
        adicionarFavorito(produtoId)
    }
}

export function adicionarFavorito(produtoId) {
    const favoritos = listarFavoritos();

    if (!favoritos.includes(produtoId)) {
        favoritos.push(produtoId);
        localStorage.setItem(CHAVE, JSON.stringify(favoritos));
    }
}

export function removerFavorito(produtoId) {
    const favoritos = listarFavoritos()
        .filter(id => id !== produtoId);

    localStorage.setItem(
        CHAVE,
        JSON.stringify(favoritos)
    );
}

export function listarFavoritos() {
    const dados = localStorage.getItem(CHAVE);

    return dados
        ? JSON.parse(dados)
        : [];
}

export function ehFavorito(produtoId) {
    return listarFavoritos().includes(produtoId);
}

export function limparFavoritos() {
    localStorage.removeItem(CHAVE);
}