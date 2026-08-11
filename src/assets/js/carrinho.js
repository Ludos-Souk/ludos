import { ROTAS } from "../../config/rotas.js";
import {
    buscarProdutosPorIds
} from "../../services/produtoService.js";
import {
    toggleFavorito,
    ehFavorito
} from "../../services/favoritosService.js";
import {
    obterUid
} from "../../services/authService.js";
import {
    estaNoCarrinho,
    quantidadeProduto,
    listarItens,
    alterarQuantidade,
    removerProduto
} from "../../services/carrinhoService.js";
import { mostrarFeedbackGlobal } from "./utils/asyncFeedback.js";
import { configurarPesquisaCabecalho, substituirPorEstado } from "./utils/ui.js";

// Inicializa ícones do Lucide
if (window.lucide) {
    window.lucide.createIcons();
}

const header = document.querySelector('.header');
const btnContinuar = document.querySelector(".btn-continue");
const inputBusca = document.getElementById('search-input');

configurarPesquisaCabecalho({
    input: inputBusca,
    aoPesquisar: (busca) => {
        if (!busca) return;
        sessionStorage.setItem("href-pesquisa", busca);
        window.location.href = ROTAS.HOME;
    }
});

// botão de filtro no cabeçalho: quando clicado redireciona para a home e abre o popup de filtro
const btnFiltro = document.getElementById('btn-filter');
if (btnFiltro) {
    btnFiltro.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.setItem('open-filter', 'true');
        window.location.href = ROTAS.HOME;
    });
}

window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
        header?.classList.add("scrolled");
    } else {
        header?.classList.remove("scrolled");
    }
});

async function listarProdutos() {

    const itens =
        listarItens();

    if (itens.length === 0) {
        return [];
    }

    const ids =
        itens.map(item => item.id);

    return await buscarProdutosPorIds(ids);

}

const cartContainer = document.getElementById('cart-items-container');
const selectAllCheckbox = document.getElementById('checkbox-select-all');

const summaryCount = document.getElementById('summary-count');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryDiscount = document.getElementById('summary-discount');
const summaryTotal = document.getElementById('summary-total');

let cartData = [];

async function inicializar() {
    cartContainer.setAttribute("aria-busy", "true");
    substituirPorEstado(cartContainer, "Carregando produtos do carrinho...", "cart-state");

    try {
        cartData = await listarProdutos();
        inicializarModalExclusao();
        renderCart();
    } catch (erro) {
        console.error("Não foi possível carregar o carrinho:", erro);
        substituirPorEstado(
            cartContainer,
            "Não foi possível carregar o carrinho. Atualize a página e tente novamente.",
            "cart-state error",
            "error"
        );
        mostrarFeedbackGlobal("Não foi possível carregar os produtos do carrinho.", "error");
    } finally {
        cartContainer.setAttribute("aria-busy", "false");
    }
}

function criarIcone(nome) {
    const icone = document.createElement("i");
    icone.setAttribute("data-lucide", nome);
    return icone;
}

function criarBotaoIcone(classe, nomeIcone, rotulo) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = classe;
    botao.setAttribute("aria-label", rotulo);
    botao.append(criarIcone(nomeIcone));
    return botao;
}

function criarAcoesCardCarrinho(item) {
    const menu = document.createElement("menu");
    menu.className = "cart-actions-left";
    const favorito = criarBotaoIcone("btn-icon action-btn", "heart", "Adicionar aos favoritos");
    const carrinho = criarBotaoIcone("btn-icon is-cart action-btn", "shopping-cart", "Remover do carrinho");
    const itemFavorito = document.createElement("li");
    const itemCarrinho = document.createElement("li");

    favorito.classList.toggle("is-favorite", ehFavorito(item.id));
    favorito.setAttribute("aria-label", ehFavorito(item.id) ? "Remover dos favoritos" : "Adicionar aos favoritos");
    itemFavorito.append(favorito);
    itemCarrinho.append(carrinho);
    menu.append(itemFavorito, itemCarrinho);
    return { menu, favorito, carrinho };
}

function criarSeletorProduto(item, index) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const indicador = document.createElement("span");

    label.className = "custom-checkbox-label";
    label.style.width = "auto";
    label.addEventListener("click", event => event.stopPropagation());
    input.type = "checkbox";
    input.className = "sr-only item-checkbox";
    input.dataset.index = index;
    input.checked = true;
    input.setAttribute("aria-label", `Selecionar ${item.nome} por ${formatarMoeda(item.preco)}`);
    indicador.className = "custom-checkbox";
    indicador.setAttribute("aria-hidden", "true");
    indicador.append(criarIcone("check"));
    label.append(input, indicador);
    return label;
}

function criarCabecalhoCardCarrinho(item, index) {
    const cabecalho = document.createElement("header");
    const acoes = criarAcoesCardCarrinho(item);
    cabecalho.className = "cart-card-header";
    cabecalho.append(acoes.menu);
    if (item.desconto > 0) {
        const badge = document.createElement("mark");
        badge.className = "badge discount-badge";
        badge.textContent = `${item.desconto}% OFF`;
        cabecalho.append(badge);
    }
    cabecalho.append(criarSeletorProduto(item, index));
    return { cabecalho, ...acoes };
}

function criarImagemCardCarrinho(item) {
    const imagem = document.createElement("img");
    imagem.src = item.imagem;
    imagem.alt = "";
    imagem.className = "product-image";
    imagem.setAttribute("aria-hidden", "true");
    return imagem;
}

function atualizarQuantidadeExibida(elemento, valor) {
    elemento.textContent = valor;
    elemento.setAttribute("aria-label", `Quantidade ${valor}`);
}

function criarControleQuantidade(item, index) {
    const controle = document.createElement("div");
    const menos = criarBotaoIcone("btn-minus action-btn", "minus", "Diminuir quantidade");
    const mais = criarBotaoIcone("btn-plus action-btn", "plus", "Aumentar quantidade");
    const quantidade = document.createElement("span");
    menos.dataset.index = index;
    mais.dataset.index = index;
    controle.className = "quantity-control";
    controle.addEventListener("click", event => event.stopPropagation());
    atualizarQuantidadeExibida(quantidade, quantidadeProduto(item.id));
    controle.append(menos, quantidade, mais);
    return { controle, menos, mais, quantidade };
}

function criarInformacoesCardCarrinho(item, index) {
    const info = document.createElement("section");
    const franquia = document.createElement("span");
    const nome = document.createElement("h4");
    const preco = document.createElement("p");
    const estoque = document.createElement("span");
    const quantidade = criarControleQuantidade(item, index);
    info.className = "cart-product-info";
    franquia.className = "brand";
    franquia.textContent = item.franquia;
    nome.className = "title";
    nome.textContent = item.nome;
    preco.className = "price";
    preco.textContent = formatarMoeda(item.preco);
    preco.setAttribute("aria-label", `Preço unitário ${formatarMoeda(item.preco)}`);
    estoque.className = "stock-info";
    estoque.textContent = `Disponível: ${item.estoque}`;
    info.append(franquia, nome, preco, quantidade.controle, estoque);
    return { info, ...quantidade };
}

function alterarQuantidadeCard(item, elemento, incremento) {
    const atual = Number(elemento.textContent);
    const novaQuantidade = atual + incremento;
    if (novaQuantidade > item.estoque) return false;
    alterarQuantidade(item.id, novaQuantidade);
    atualizarQuantidadeExibida(elemento, novaQuantidade);
    calcularTotal();
    return true;
}

function configurarEventosCardCarrinho(article, item, elementos) {
    elementos.favorito.addEventListener("click", () => {
        elementos.favorito.classList.toggle("is-favorite");
        toggleFavorito(item.id);
    });
    elementos.mais.addEventListener("click", () => alterarQuantidadeCard(item, elementos.quantidade, 1));
    elementos.menos.addEventListener("click", event => {
        if (Number(elementos.quantidade.textContent) === 1) {
            abrirModalExclusao(article, item.id, event.currentTarget);
            return;
        }
        alterarQuantidadeCard(item, elementos.quantidade, -1);
    });
    elementos.carrinho.addEventListener("click", event => {
        abrirModalExclusao(article, item.id, event.currentTarget);
    });
}

function criarCardCarrinho(item, index) {
    const article = document.createElement("article");
    const cabecalho = criarCabecalhoCardCarrinho(item, index);
    const informacoes = criarInformacoesCardCarrinho(item, index);
    article.className = "cart-product-card selecionado";
    article.dataset.index = index;
    article.append(cabecalho.cabecalho, criarImagemCardCarrinho(item), informacoes.info);
    configurarEventosCardCarrinho(article, item, { ...cabecalho, ...informacoes });
    return article;
}

function renderizarCarrinhoVazio() {
    const vazio = document.createElement("section");
    const titulo = document.createElement("h3");
    const orientacao = document.createElement("p");
    vazio.className = "cart-state empty";
    vazio.setAttribute("aria-labelledby", "cart-empty-title");
    titulo.id = "cart-empty-title";
    titulo.textContent = "Seu carrinho está vazio.";
    orientacao.textContent = "Adicione produtos para continuar sua compra.";
    vazio.append(titulo, orientacao);
    cartContainer.append(vazio);
    selectAllCheckbox.checked = false;
    document.querySelector(".select-all-wrapper")?.classList.remove("selecionado");
    calcularTotal();
    btnContinuar.disabled = true;
}

function renderCart() {
    cartContainer.replaceChildren();
    if (cartData.length === 0) {
        renderizarCarrinhoVazio();
        return;
    }
    const fragment = document.createDocumentFragment();
    cartData.forEach((item, index) => fragment.append(criarCardCarrinho(item, index)));
    cartContainer.append(fragment);
    selectAllCheckbox.checked = true;
    document.querySelector(".select-all-wrapper")?.classList.add("selecionado");
    window.lucide?.createIcons();
    calcularTotal();
}

function definirSelecaoProduto(input, selecionado) {
    input.checked = selecionado;
    input.closest(".cart-product-card")?.classList.toggle("selecionado", selecionado);
}

function sincronizarEstadoSelecao() {
    const checkboxes = [...document.querySelectorAll(".item-checkbox")];
    const quantidadeSelecionada = checkboxes.filter(input => input.checked).length;
    const todosSelecionados = checkboxes.length > 0 && quantidadeSelecionada === checkboxes.length;

    selectAllCheckbox.checked = todosSelecionados;
    selectAllCheckbox.indeterminate = quantidadeSelecionada > 0 && !todosSelecionados;
    document.querySelector(".select-all-wrapper")?.classList.toggle("selecionado", todosSelecionados);
    calcularTotal();
    habilitarContinuar();
}

cartContainer.addEventListener("change", (event) => {
    if (!event.target.classList.contains("item-checkbox")) return;
    definirSelecaoProduto(event.target, event.target.checked);
    sincronizarEstadoSelecao();
});

cartContainer.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !event.target.classList.contains("item-checkbox")) return;
    event.preventDefault();
    event.target.click();
});

cartContainer.addEventListener("click", (event) => {
    if (event.target.closest("button, a, input, label, select, textarea")) return;
    const card = event.target.closest(".cart-product-card");
    const input = card?.querySelector(".item-checkbox");
    input?.click();
});

// Selecionar ou desmarcar todos
selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    document.querySelectorAll(".item-checkbox")
        .forEach(input => definirSelecaoProduto(input, isChecked));
    sincronizarEstadoSelecao();
});

function calcularTotal() {
    const cardsSelecionados =
        document.querySelectorAll(
            ".cart-product-card.selecionado"
        );
    let quantidadeTotal = 0;
    let subtotal = 0;
    let desconto = 0;
    cardsSelecionados.forEach(card => {
        const index =
            Number(card.dataset.index);
        const produto =
            cartData[index];
        const quantidade =
            quantidadeProduto(
                produto.id
            );
        quantidadeTotal +=
            quantidade;
        subtotal +=
            produto.preco *
            quantidade;
        desconto +=
            (
                produto.preco *
                (produto.desconto / 100)
            ) *
            quantidade;
    });
    const total =
        subtotal - desconto;
    summaryCount.textContent =
        quantidadeTotal;
    summarySubtotal.textContent =
        formatarMoeda(
            subtotal
        );
    summaryDiscount.textContent =
        formatarMoeda(
            desconto
        );
    summaryTotal.textContent =
        formatarMoeda(
            Math.max(total, 0)
        );
}

function removerProdutoTela(article, produtoId) {
    removerProduto(produtoId);
    cartData = cartData.filter(produto => produto.id !== produtoId);
    renderCart();
    habilitarContinuar();
}

const btnHeaderCarrinho = document.querySelector('button[aria-label="Ver meu carrinho"]');
if (btnHeaderCarrinho) {
    btnHeaderCarrinho.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function habilitarContinuar() {
    const cardsSelecionados =
        document.querySelectorAll(
            ".cart-product-card.selecionado"
        );

    btnContinuar.disabled = cardsSelecionados.length === 0;
}

btnContinuar.addEventListener("click", () => {

    const cardsSelecionados =
        document.querySelectorAll(
            ".cart-product-card.selecionado"
        );

    const produtosSelecionados =
        [...cardsSelecionados].map(card => {

            const index =
                Number(card.dataset.index);

            const produto =
                cartData[index];

            return {
                id: produto.id,
                quantidade: quantidadeProduto(produto.id)
            };

        });

    if (produtosSelecionados.length === 0) {
        return;
    }

    sessionStorage.setItem(
        "produtosSelecionados",
        JSON.stringify(produtosSelecionados)
    );
    window.location.href = ROTAS.FINALIZAR_PEDIDO;
});

// Renderiza a lista assim que o script carregar
inicializar();

// ============================================================
// Lógica do Modal de Exclusão
// ============================================================
let itemParaExcluir = null;
let botaoQueAbriuModal = null;

const modalDelete = document.getElementById('modal-delete-confirm');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

function cancelarExclusao() {
    modalDelete.close();
    document.body.classList.remove("modal-open");
    
    if (botaoQueAbriuModal) {
        botaoQueAbriuModal.focus();
    }
    itemParaExcluir = null;
}

function inicializarModalExclusao() {
    if (!modalDelete) return;

    btnCancelDelete.addEventListener('click', cancelarExclusao);

    modalDelete.addEventListener('click', (event) => {
        if (event.target === modalDelete) {
            cancelarExclusao();
        }
    });

    btnConfirmDelete.addEventListener('click', () => {
        if (itemParaExcluir) {
            removerProdutoTela(itemParaExcluir.article, itemParaExcluir.id);
        }
        modalDelete.close();
        document.body.classList.remove("modal-open");
        
        const tituloPagina = document.querySelector('.cart-page-title');
        if (tituloPagina) {
            tituloPagina.setAttribute('tabindex', '-1');
            tituloPagina.focus({ preventScroll: true });
        }
        
        itemParaExcluir = null;
    });
}

function abrirModalExclusao(article, id, triggerElement) {
    botaoQueAbriuModal = triggerElement;
    itemParaExcluir = { article, id };
    
    document.body.classList.add("modal-open");
    modalDelete.showModal();
}
