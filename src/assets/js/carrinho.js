import { ROTAS } from "../../config/rotas.js";
import {
    buscarProdutosPorIds
} from "../../services/produtoService.js";
import {
    toggleFavorito,
    ehFavorito
} from "../../services/favoritosService.js";
import {
    verificarLogin,
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

const VALOR_DESCONTO = 0; 

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

function renderCart() {

    cartContainer.replaceChildren();

    if (cartData.length === 0) {
        const vazio = document.createElement("section");
        vazio.className = "cart-state empty";
        vazio.setAttribute("aria-labelledby", "cart-empty-title");
        const tituloVazio = document.createElement("h3");
        tituloVazio.id = "cart-empty-title";
        tituloVazio.textContent = "Seu carrinho está vazio.";
        const orientacaoVazio = document.createElement("p");
        orientacaoVazio.textContent = "Adicione produtos para continuar sua compra.";
        vazio.append(tituloVazio, orientacaoVazio);
        cartContainer.append(vazio);
        selectAllCheckbox.checked = false;
        document.querySelector(".select-all-wrapper")?.classList.remove("selecionado");
        calcularTotal();
        btnContinuar.disabled = true;
        return;
    }

    let todosSelecionados =
        cartData.length > 0;

    const fragment =
        document.createDocumentFragment();

    cartData.forEach((item, index) => {
        // ============================
        // Card
        // ============================

        const article =
            document.createElement(
                "article"
            );

        article.className =
            "cart-product-card";

        article.classList.add(
            "selecionado"
        );
        
        article.dataset.index =
            index;

        article.tabIndex = 0;

        article.setAttribute(
            "role",
            "checkbox"
        );

        article.setAttribute(
            "aria-checked",
            true
        );

        article.setAttribute(
            "aria-label",
            `Selecionar ${item.nome} por ${formatarMoeda(item.preco)}`
        );

        // ============================
        // Header
        // ============================

        const header =
            document.createElement(
                "header"
            );

        header.className =
            "cart-card-header";


        const menu =
            document.createElement(
                "menu"
            );

        menu.className =
            "cart-actions-left";

        // Favorito

        const favoritoLi =
            document.createElement(
                "li"
            );

        const btnFavorito =
            document.createElement(
                "button"
            );

        btnFavorito.type =
            "button";

        btnFavorito.className =
            "btn-icon action-btn";

        if (ehFavorito(item.id)) {
            btnFavorito.classList.add(
                "is-favorite"
            );
        }

        btnFavorito.setAttribute(
            "aria-label",
            ehFavorito(item.id)
                ? "Remover dos favoritos"
                : "Adicionar aos favoritos"
        );

        const iconeFavorito =
            document.createElement(
                "i"
            );

        iconeFavorito.setAttribute(
            "data-lucide",
            "heart"
        );

        btnFavorito.append(
            iconeFavorito
        );

        favoritoLi.append(
            btnFavorito
        );

        // Carrinho

        const carrinhoLi =
            document.createElement(
                "li"
            );

        const btnCarrinho =
            document.createElement(
                "button"
            );

        btnCarrinho.type =
            "button";

        btnCarrinho.className =
            "btn-icon is-cart action-btn";

        btnCarrinho.setAttribute(
            "aria-label",
            "Remover do carrinho"
        );

        const iconeCarrinho =
            document.createElement(
                "i"
            );

        iconeCarrinho.setAttribute(
            "data-lucide",
            "shopping-cart"
        );

        btnCarrinho.append(
            iconeCarrinho
        );

        carrinhoLi.append(
            btnCarrinho
        );

        menu.append(
            favoritoLi,
            carrinhoLi
        );

        // ============================
        // Checkbox
        // ============================

        const label =
            document.createElement(
                "label"
            );

        label.className =
            "custom-checkbox-label";

        label.style.width =
            "auto";

        label.addEventListener(
            "click",
            e => e.stopPropagation()
        );

        const input =
            document.createElement(
                "input"
            );

        input.type =
            "checkbox";

        input.className =
            "sr-only item-checkbox";

        input.dataset.index =
            index;

        input.checked = true;

        input.tabIndex = -1;

        const checkbox =
            document.createElement(
                "span"
            );

        checkbox.className =
            "custom-checkbox";

        checkbox.setAttribute(
            "aria-hidden",
            "true"
        );

        const iconeCheck =
            document.createElement(
                "i"
            );

        iconeCheck.setAttribute(
            "data-lucide",
            "check"
        );

        checkbox.append(
            iconeCheck
        );

        label.append(
            input,
            checkbox
        );

        header.append(
            menu
        );

        if (item.desconto > 0) {
            const badge = document.createElement(
                "mark"
            );
            badge.className =
                "badge discount-badge";
            badge.textContent =
                `${item.desconto}% OFF`;
            header.append(
                badge
            );
        }

        header.append(
            label
        );

        // ============================
        // Imagem
        // ============================

        const imagem =
            document.createElement(
                "img"
            );

        imagem.src =
            item.imagem;

        imagem.alt =
            "";

        imagem.className =
            "product-image";

        imagem.setAttribute(
            "aria-hidden",
            "true"
        );

        // ============================
        // Informações
        // ============================

        const info =
            document.createElement(
                "section"
            );

        info.className =
            "cart-product-info";

        const franquia =
            document.createElement(
                "span"
            );

        franquia.className =
            "brand";

        franquia.textContent =
            item.franquia;

        const nome =
            document.createElement(
                "h4"
            );

        nome.className =
            "title";

        nome.textContent =
            item.nome;

        const preco =
            document.createElement(
                "p"
            );

        preco.className =
            "price";

        preco.textContent =
            formatarMoeda(item.preco);

        preco.setAttribute(
            "aria-label",
            `Preço unitário ${formatarMoeda(item.preco)}`
        );

        // ============================
        // Quantidade
        // ============================

        const controle =
            document.createElement(
                "div"
            );

        controle.className =
            "quantity-control";

        controle.addEventListener(
            "click",
            e => e.stopPropagation()
        );

        const btnMenos =
            document.createElement(
                "button"
            );

        btnMenos.type =
            "button";

        btnMenos.className =
            "btn-minus action-btn";

        btnMenos.dataset.index =
            index;

        btnMenos.setAttribute(
            "aria-label",
            "Diminuir quantidade"
        );

        const iconeMenos =
            document.createElement(
                "i"
            );

        iconeMenos.setAttribute(
            "data-lucide",
            "minus"
        );

        btnMenos.append(
            iconeMenos
        );

        const quantidade =
            document.createElement(
                "span"
            );

        quantidade.textContent = quantidadeProduto(item.id);

        quantidade.setAttribute(
            "aria-label",
            `Quantidade ${item.quantidade}`
        );

        const btnMais =
            document.createElement(
                "button"
            );

        btnMais.type =
            "button";

        btnMais.className =
            "btn-plus action-btn";

        btnMais.dataset.index =
            index;

        btnMais.setAttribute(
            "aria-label",
            "Aumentar quantidade"
        );

        const iconeMais =
            document.createElement(
                "i"
            );

        iconeMais.setAttribute(
            "data-lucide",
            "plus"
        );

        btnMais.append(
            iconeMais
        );

        controle.append(
            btnMenos,
            quantidade,
            btnMais
        );

        // ============================
        // Estoque
        // ============================

        const estoque =
            document.createElement(
                "span"
            );

        estoque.className =
            "stock-info";

        estoque.textContent =
            `Disponível: ${item.estoque}`;

        info.append(
            franquia,
            nome,
            preco,
            controle,
            estoque
        );

        // ============================
        // Eventos
        // ============================

        btnFavorito.addEventListener("click", (event) => {
            btnFavorito.classList.toggle("is-favorite");
            toggleFavorito(item.id);
        });

        btnMais.addEventListener("click", () => {
            const quantidadeAtual =
                Number(quantidade.textContent);
            if (quantidadeAtual >= item.estoque) {
                return;
            }
            alterarQuantidade(
                item.id,
                quantidadeAtual + 1
            );
            quantidade.textContent =
                quantidadeAtual + 1;
            quantidade.setAttribute(
                "aria-label",
                `Quantidade ${quantidadeAtual + 1}`
            );
            calcularTotal();
        });

        btnMenos.addEventListener("click", (event) => {
            const quantidadeAtual =
                Number(quantidade.textContent);
            if (quantidadeAtual === 1) {
                abrirModalExclusao(article, item.id, event.currentTarget);
                return;
            }
            alterarQuantidade(
                item.id,
                quantidadeAtual - 1
            );
            quantidade.textContent =
                quantidadeAtual - 1;
            quantidade.setAttribute(
                "aria-label",
                `Quantidade ${quantidadeAtual - 1}`
            );
            calcularTotal();
        });

        btnCarrinho.addEventListener("click", (event) => {
            abrirModalExclusao(article, item.id, event.currentTarget);
        });

        article.append(
            header,
            imagem,
            info
        );

        fragment.append(
            article
        );

    });

    cartContainer.append(
        fragment
    );

    selectAllCheckbox.checked =
        todosSelecionados;

    document
        .querySelector(".select-all-wrapper")
        ?.classList.toggle(
            "selecionado",
            todosSelecionados
        );

    if (window.lucide) {
        window.lucide.createIcons();
    }

    calcularTotal();
}

cartContainer.addEventListener("change", (event) => {
    if (!event.target.classList.contains("item-checkbox")) return;

    const article = event.target.closest(".cart-product-card");
    article?.classList.toggle("selecionado", event.target.checked);

    const todosSelecionados = verificarTodosSelecionados();
    document.querySelector(".select-all-wrapper")?.classList.toggle("selecionado", todosSelecionados);
    selectAllCheckbox.checked = todosSelecionados;
    calcularTotal();
    habilitarContinuar();
});

function alternarSelecao(article) {
    article.classList.toggle(
        "selecionado"
    );
    renderCart();
}

// Selecionar ou desmarcar todos
selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    document
        .querySelectorAll(".cart-product-card")
        .forEach(card => {
            card.classList.toggle(
                "selecionado",
                isChecked
            );
            card.querySelector('.sr-only.item-checkbox').checked = isChecked
        });
    
    const selectAll =  document.querySelector(".select-all-wrapper");
    habilitarContinuar();
    if (isChecked) {
        selectAll.classList.add('selecionado');
        return;
    }
    selectAll.classList.remove('selecionado');
});

function verificarTodosSelecionados() {
    const cards = document.querySelectorAll(".cart-product-card");
    if (cards.length === 0) {
        return false;
    }
    return [...cards].every(card =>
        card.classList.contains("selecionado")
    );
}

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
