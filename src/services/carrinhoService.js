const CHAVE_CARRINHO = "carrinho";

export function listarItens() {

    const carrinho =
        localStorage.getItem(
            CHAVE_CARRINHO
        );

    return carrinho
        ? JSON.parse(carrinho)
        : [];

}

export function adicionarProduto(
    produto
) {

    const itens =
        listarItens();

    const itemExistente =
        itens.find(
            item =>
                item.produtoId ===
                produto.produtoId
        );

    if (itemExistente) {

        itemExistente.quantidade++;

    } else {

        itens.push(produto);

    }

    localStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(itens)
    );

}

export function removerProduto(
    produtoId
) {

    const itens =
        listarItens();

    const novoCarrinho =
        itens.filter(
            item =>
                item.produtoId !==
                produtoId
        );

    localStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(
            novoCarrinho
        )
    );

}

export function alterarQuantidade(
    produtoId,
    quantidade
) {

    const itens =
        listarItens();

    const item =
        itens.find(
            item =>
                item.produtoId ===
                produtoId
        );

    if (!item) {
        return;
    }

    item.quantidade =
        quantidade;

    localStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(itens)
    );

}

export function limparCarrinho() {

    localStorage.removeItem(
        CHAVE_CARRINHO
    );

}

export function calcularTotal() {

    const itens =
        listarItens();

    return itens.reduce(
        (
            total,
            item
        ) =>
            total +
            (
                item.preco *
                item.quantidade
            ),
        0
    );

}