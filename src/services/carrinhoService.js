import {
    buscarProdutosPorIds
} from "./produtoService.js";

const CHAVE_CARRINHO = "carrinho";

export function toggleCarrinho(produtoId) {
    if (estaNoCarrinho(produtoId)) {
        removerProduto(produtoId)
    } else {
        adicionarProduto(produtoId)
    }
}

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
    produtoId
) {

    const itens =
        listarItens();

    const itemExistente =
        itens.find(
            item =>
                item.id ===
                produtoId
        );

    if (itemExistente) {

        itemExistente.quantidade++;

    } else {

        itens.push({

            id: produtoId,
            quantidade: 1

        });

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
                item.id !==
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
                item.id ===
                produtoId
        );

    if (!item) {
        return;
    }

    if (quantidade <= 0) {

        removerProduto(
            produtoId
        );

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

export function estaNoCarrinho(
    produtoId
) {

    return listarItens().some(
        item =>
            item.id ===
            produtoId
    );

}

export function buscarItemCarrinho(
    produtoId
) {

    return listarItens().find(
        item =>
            item.id ===
            produtoId
    ) || null;

}

export function quantidadeProduto(
    produtoId
) {

    const item =
        buscarItemCarrinho(
            produtoId
        );

    return item
        ? item.quantidade
        : 0;

}

export async function listarProdutosCarrinho() {

    const itens =
        listarItens();

    if (itens.length === 0) {
        return [];
    }

    const ids =
        itens.map(
            item => item.id
        );

    const produtos =
        await buscarProdutosPorIds(ids);

    return produtos.map(produto => {

        const itemCarrinho =
            itens.find(
                item =>
                    item.id ===
                    produto.id
            );

        return {

            produto,
            quantidade:
                itemCarrinho.quantidade

        };

    });

}

export async function calcularTotal() {

    const itens =
        await listarProdutosCarrinho();

    return itens.reduce(

        (
            total,
            item
        ) => {

            const precoComDesconto =
                item.produto.preco *
                (
                    1 -
                    item.produto.desconto / 100
                );

            return total +
                (
                    precoComDesconto *
                    item.quantidade
                );

        },

        0

    );

}

export function quantidadeProdutos() {
    return listarItens().length;
}