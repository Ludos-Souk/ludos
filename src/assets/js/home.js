import { ROTAS } from "../../config/rotas.js";
// #region Imports
import {
    buscarProdutosAtivos,
    buscarProdutoPorId
} from "../../services/produtoService.js";
import {
    toggleFavorito,
    ehFavorito
} from "../../services/favoritosService.js";
import { aguardarUsuario, obterUid } from "../../services/authService.js";
import {
    listarEnderecos
} from "../../services/usuarioService.js";
import {
    toggleCarrinho,
    estaNoCarrinho,
    quantidadeProdutos,
    buscarItemCarrinho
} from "../../services/carrinhoService.js";
import {
    existeConfiguracao,
    obterConfiguracao,
    salvarConfiguracao,
    removerConfiguracao
} from "../../services/configuracoesService.js";
import {
    listarPedidosUsuario
} from "../../services/pedidoService.js";
import Avaliacao from "../../models/Avaliacao.js";
import { criarAvaliacoesPedido } from "../../services/avaliacaoService.js";
import { configurarPromocaoPrimeiraCompra } from "./utils/promocaoPrimeiraCompra.js";
import { configurarPesquisaCabecalho } from "./utils/ui.js";
// #endregion


// #region Seleção de elementos do DOM
const btnAbrirModal = document.querySelector('.btn-change-address');
const modalEndereco = document.getElementById('modal-endereco');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const modalBody = document.querySelector('.modal-body');
const btnConfirmar = document.querySelector('.btn-confirmar');
const sideCards = document.querySelector('.side-cards');
const btnIrParaCadastro = document.querySelector('.btn-adicionar');

// Banner e cabeçalho
const banner = document.querySelector('.promo-banner');
const header = document.querySelector('.header');

// Busca
const inputBusca = document.getElementById('search-input');

// Catálogo de produtos
const listaProdutos = document.querySelector('#lista-bonecos-firebase');

// Filtro / ordenação
const btnFiltro = document.getElementById('btn-filter');
const popupFiltro = document.getElementById('filter-popup');
const btnOpcoesFiltro = document.querySelectorAll('.btn-filter-option');
const filterMenu = document.querySelector('.filter-menu');

// Estado
let bannerFechado = false;
let timeoutToast = null;
let pedidosDoUsuario = [];
let indicePedidoAtual = 0;
let temporizadorPedidos = null;
let rotacaoPedidosPausada = false;
let pedidoEmAvaliacao = null;
let botaoAvaliacaoAtivo = null;
// #endregion


// #region Métodos

function criarMensagemEstado(texto, classe = "estado-vazio") {
    const mensagem = document.createElement("p");
    mensagem.className = classe;
    mensagem.textContent = texto;
    return mensagem;
}

// --- Acesso / configurações salvas ---

function configurarEndereco() {
    if (existeConfiguracao("enderecoPadrao")) {
        const enderecoPadrao = obterConfiguracao("enderecoPadrao");

        criarCardEndereco(
            enderecoPadrao.etiqueta
        );
    }
}

function configurarOrdem() {
    const tipoOrdenacao = obterConfiguracao("tipoOrdenacao");

    if (!tipoOrdenacao) {
        return;
    }

    const botao = document.querySelector(`.btn-filter-option[data-sort="${tipoOrdenacao}"]`);
    if (botao) {
        botao.classList.add("selecionado");
    }
}

function configurarCarrinho() {
    const card = document.querySelector('.card.side-card.cart-card');

    if (!card) {
        return;
    }
    
    card.querySelector(".cart-badge")?.remove();

    const valor = quantidadeProdutos();
    
    if (valor > 0) {
        const badge = document.createElement("span");

        badge.className = "cart-badge";
        badge.id = "badge-carrinho-home";
        badge.textContent = valor;
        badge.setAttribute(
            "aria-label",
            `${valor} ${valor === 1 ? "produto" : "produtos"} no carrinho`
        );

        card.prepend(badge);
    }
}

function inicializarIconesLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}


// --- Navegação para o Carrinho ---

function inicializarNavegacaoCarrinho() {
    const btnHeaderCarrinho = 
        document.querySelector('button[aria-label="Ver meu carrinho"]');
        
    if (btnHeaderCarrinho) {
        btnHeaderCarrinho.addEventListener('click', () => {
            window.location.href = ROTAS.CARRINHO;
        });
    }

    const cartCard = 
        document.querySelector('.cart-card');
        
    if (cartCard) {
        cartCard.addEventListener('click', () => {
            window.location.href = ROTAS.CARRINHO;
        });
    }
}


// --- Banner promocional ---

function alternarBanner() {
    bannerFechado = true;

    banner.classList.add("oculto");

    document.querySelector('.header').classList.add('sem-banner');

    document.querySelector('.main-content').style.marginTop = "160px";
}

function inicializarBanner() {
    window.alternarBanner = alternarBanner;

    window.addEventListener("scroll", () => {
        const toast = document.getElementById("cart-toast");

        if (window.scrollY > 30) {
            banner?.classList.add("compact");
            toast?.classList.add("compact");
            header?.classList.add("scrolled");
        } else {
            banner?.classList.remove("compact");
            toast?.classList.remove("compact");
            header?.classList.remove("scrolled");
        }
    });
}

// --- Toast de carrinho ---

export function mostrarToastCarrinho(
    mensagem = "Produto adicionado ao carrinho com sucesso!"
) {
    const header = document.querySelector('.header');
    const mainContent = document.querySelector('.main-content'); 

    if (!bannerFechado) {
        banner.classList.add("oculto");
    }

    header.classList.remove("sem-banner");
    mainContent.style.marginTop = "290px"; 

    const toastExistente = document.getElementById("cart-toast");
    if (toastExistente) {
        toastExistente.remove();
    }

    if (timeoutToast) {
        clearTimeout(timeoutToast);
    }

    const toast = document.createElement("aside");
    toast.id = "cart-toast";
    toast.className = "cart-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");

    const content = document.createElement("span");
    content.className = "cart-toast-content";

    const icon = document.createElement("span");
    icon.className = "cart-toast-icon";
    icon.setAttribute("aria-hidden", "true");

    const iconCheck = document.createElement("i");
    iconCheck.setAttribute("data-lucide", "check");
    icon.appendChild(iconCheck);

    const paragraph = document.createElement("p");
    paragraph.textContent = mensagem;

    content.append(icon, paragraph);

    const actions = document.createElement("span");
    actions.className = "cart-toast-actions";

    const btnCart = document.createElement("button");
    btnCart.type = "button";
    btnCart.className = "btn-go-cart";
    btnCart.textContent = "Ir para carrinho";

    const btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.className = "btn-close-toast";
    btnClose.setAttribute("aria-label", "Fechar aviso");

    const iconClose = document.createElement("i");
    iconClose.setAttribute("data-lucide", "x");
    btnClose.appendChild(iconClose);

    actions.append(btnCart, btnClose);
    toast.append(content, actions);

    header.appendChild(toast);

    if (window.scrollY > 30) {
        toast.classList.add("compact");
    }

    if (window.lucide) {
        lucide.createIcons();
    }

    btnClose.addEventListener("click", () => { 
        toast.remove();
        
        if (!bannerFechado) {
            banner.classList.remove("oculto");
        } else {
            header.classList.add("sem-banner");
            mainContent.style.marginTop = "160px"; 
        }
    });

    btnCart.addEventListener("click", () => {
        window.location.href = ROTAS.CARRINHO;
    });

    timeoutToast = setTimeout(() => {
        toast.remove();
        timeoutToast = null;

        if (!bannerFechado) {
            banner.classList.remove("oculto");
        } else {
            header.classList.add("sem-banner");
            mainContent.style.marginTop = "160px"; 
        }
    }, 20000);
}


// --- Popup de opções de listagem (filtro) ---

function abrirPopupFiltro() {
    popupFiltro.classList.remove('oculto');
    btnFiltro.setAttribute('aria-expanded', 'true');
    
    setTimeout(() => {
        const primeiraOpcao = popupFiltro.querySelector('.btn-filter-option');
        if (primeiraOpcao) primeiraOpcao.focus();
    }, 100);
}

function fecharPopupFiltro() {
    popupFiltro.classList.add('oculto');
    btnFiltro.setAttribute('aria-expanded', 'false');
    btnFiltro.focus(); 
}

function inicializarPopupFiltro() {
    btnFiltro.addEventListener('click', (event) => {
        event.stopPropagation(); 
        const estaAberto = btnFiltro.getAttribute('aria-expanded') === 'true';
        
        if (estaAberto) {
            fecharPopupFiltro();
        } else {
            abrirPopupFiltro();
        }
    });

    document.addEventListener('click', (event) => {
        if (!popupFiltro.classList.contains('oculto') && !popupFiltro.contains(event.target) && event.target !== btnFiltro) {
            fecharPopupFiltro();
        }
    });

    popupFiltro.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            fecharPopupFiltro();
        }
    });
}

function inicializarFiltroMenu() {
    filterMenu.addEventListener("click", async function (event) {
        const button = event.target.closest(".btn-filter-option");

        if (!button) return;

        const tipoOrdenacao = button.dataset.sort;
        if (button.classList.contains("selecionado")) {
            button.classList.remove("selecionado");
            removerConfiguracao("tipoOrdenacao");
        } else {
            document.querySelectorAll(".btn-filter-option.selecionado")
                .forEach((btn) => btn.classList.remove("selecionado"));
            button.classList.add("selecionado");
            salvarConfiguracao("tipoOrdenacao", tipoOrdenacao);
        }

        await carregarCatalogo();
    });
}


function filtrarPorNome(nome) {
    const container = document.getElementById("lista-bonecos-firebase");

    const cards =
        container.querySelectorAll(".product-card");

    const termo =
        nome.trim().toLowerCase();

    cards.forEach(card => {

        const titulo =
            card.querySelector(".title");

        if (!titulo) {
            return;
        }

        const nomeProduto =
            titulo.textContent
                .trim()
                .toLowerCase();

        if (
            termo === "" ||
            nomeProduto.includes(termo)
        ) {
            card.classList.remove("oculto");
        } else {
            card.classList.add("oculto");
        }

    });
}

// --- Navegação vinda de outras páginas (sessionStorage) ---

function hrefPesquisa() {
    const hrefPesquisa = sessionStorage.getItem("href-pesquisa");

    if (!hrefPesquisa) {
        return;
    }

    inputBusca.value = hrefPesquisa;
    filtrarPorNome(hrefPesquisa);

    sessionStorage.removeItem("href-pesquisa");
}

function hrefEndereco() {
    const hrefEndereco = sessionStorage.getItem("href-endereco");

    if (!hrefEndereco) {
        return;
    }

    salvarConfiguracao(
        "enderecoPadrao",
        JSON.parse(hrefEndereco)
    );

    abrirModalEndereco();
    carregarEnderecos();

    sessionStorage.removeItem("href-endereco");
}

function hrefFiltro() {
    const abrirFiltro = sessionStorage.getItem('open-filter');
    if (!abrirFiltro) return;

    // garante que o popup e listeners já existem
    abrirPopupFiltro();
    sessionStorage.removeItem('open-filter');
}


// --- Modal de endereço ---

function abrirModalEndereco() {
    modalEndereco.showModal();

    requestAnimationFrame(() => {
        const modalBody = modalEndereco.querySelector('.modal-body');
        document.body.classList.add("modal-open");
        if (modalBody) modalBody.scrollTop = 0;
        btnFecharModal.focus();
    });
}

async function carregarEnderecos() {
    const uid = obterUid();

    if (!uid) {
        return;
    }

    modalBody?.setAttribute("aria-busy", "true");
    modalBody?.replaceChildren(criarMensagemEstado("Carregando endereços..."));
    try {
        const enderecos = await listarEnderecos(uid);
        if (enderecos.length) {
            carregarListaEnderecos(enderecos);
        } else {
            modalBody?.replaceChildren(criarMensagemEstado("Você ainda não possui endereços cadastrados."));
        }
    } catch (erro) {
        console.error("Não foi possível carregar os endereços:", erro);
        modalBody?.replaceChildren(criarMensagemEstado("Não foi possível carregar seus endereços."));
    } finally {
        modalBody?.setAttribute("aria-busy", "false");
    }
}

function inicializarModalEndereco() {
    
    if (sideCards) {
        sideCards.addEventListener("click", (event) => {

            const botao =
                event.target.closest(".btn-change-address");

            if (!botao) {
                return;
            }

            abrirModalEndereco();
            carregarEnderecos();

        });
    }

    if (modalEndereco) {
        btnFecharModal.addEventListener('click', () => {
            document.body.classList.remove("modal-open");
            modalEndereco.close();
        });

        modalEndereco.addEventListener('click', (event) => {
            if (event.target === modalEndereco) {
                document.body.classList.remove("modal-open");
                modalEndereco.close();
            }
        });
    }

    if (btnIrParaCadastro) {
        btnIrParaCadastro.addEventListener('click', () => {
            window.location.href = ROTAS.ENDERECO;
        });
    }
}

function inicializarBtnConfirmar() {
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            document.body.classList.remove("modal-open");
            modalEndereco.close();
        });
    }
}

function criarCardEndereco(etiqueta) {

    document.querySelector('.card.address-card')?.remove();

    const sideCards =
        document.querySelector(
            ".side-cards"
        );
        
    if (!sideCards) return null;

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "card address-card";

    card.setAttribute(
        "aria-labelledby",
        "dashboard-address-title"
    );

    const header =
        document.createElement(
            "header"
        );

    header.className =
        "address-info";

    const titulo =
        document.createElement(
            "h3"
        );

    titulo.id =
        "dashboard-address-title";

    titulo.className =
        "address-label";

    titulo.textContent =
        "Endereço";

    const endereco =
        document.createElement(
            "p"
        );

    endereco.className =
        "address-value";

    const icone =
        document.createElement(
            "i"
        );

    icone.setAttribute(
        "data-lucide",
        "map-pin"
    );

    icone.setAttribute(
        "aria-hidden",
        "true"
    );

    endereco.append(
        icone,
        ` ${etiqueta}`
    );

    header.append(
        titulo,
        endereco
    );

    const botao =
        document.createElement(
            "button"
        );

    botao.type =
        "button";

    botao.className =
        "btn-change-address";

    botao.setAttribute(
        "aria-label",
        "Alterar endereço de entrega"
    );

    botao.textContent =
        "Alterar";

    card.append(
        header,
        botao
    );

    sideCards.append(
        card
    );

    if (window.lucide) {
        window.lucide.createIcons();
    }

    return card;

}

function carregarListaEnderecos(enderecos) {

    const modalBody =
        document.querySelector(
            ".modal-body"
        );
        
    if (!modalBody) return;

    modalBody.classList.remove(
        "modal-body-empty"
    );

    modalBody.replaceChildren();

    const lista =
        document.createElement(
            "ul"
        );

    lista.className =
        "address-list";

    lista.role =
        "listbox";

    lista.ariaLabel =
        "Selecione um endereço de entrega";

    const fragment =
        document.createDocumentFragment();

    enderecos.forEach(endereco => {

        const item =
            document.createElement(
                "li"
            );

        item.role =
            "option";

        item.dataset.id =
            endereco.id;

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "address-option-card";

        card.dataset.id = endereco.id;
        card.dataset.etiqueta = endereco.etiqueta;

        if (obterConfiguracao("enderecoPadrao")?.id === endereco.id) {
            card.classList.add("selecionado");
        }

        card.tabIndex = 0;

        card.setAttribute(
            "role",
            "button"
        );

        const header =
            document.createElement(
                "header"
            );

        const tag =
            document.createElement(
                "h4"
            );

        tag.className =
            "address-tag";

        tag.textContent =
            endereco.etiqueta;

        header.append(
            tag
        );

        const content =
            document.createElement(
                "section"
            );

        content.className =
            "address-option-content";

        const icone =
            document.createElement(
                "i"
            );

        icone.setAttribute(
            "data-lucide",
            "map-pin"
        );

        icone.setAttribute(
            "aria-hidden",
            "true"
        );

        const address =
            document.createElement(
                "address"
            );

        address.className =
            "address-text";

        const nome =
            document.createElement(
                "span"
            );

        nome.className =
            "address-name";

        nome.textContent =
            endereco.nome;

        const rua =
            document.createElement(
                "span"
            );

        rua.className =
            "address-street";

        rua.textContent =
            `${endereco.rua} Nº ${endereco.numero}`;

        const cep =
            document.createElement(
                "span"
            );

        cep.className =
            "address-cep";

        cep.textContent =
            `CEP: ${endereco.cep} - ${endereco.cidade}, ${endereco.uf}`;

        address.append(
            nome,
            rua,
            cep
        );

        const botaoEditar =
            document.createElement(
                "button"
            );

        botaoEditar.type =
            "button";

        botaoEditar.className =
            "btn-edit-address";

        botaoEditar.setAttribute(
            "aria-label",
            `Editar endereço ${endereco.etiqueta}`
        );

        botaoEditar.dataset.id = endereco.id;

        botaoEditar.textContent =
            "Editar";

        content.append(
            icone,
            address,
            botaoEditar
        );

        card.append(
            header,
            content
        );

        item.append(
            card
        );

        fragment.append(
            item
        );

    });

    lista.append(
        fragment
    );

    modalBody.append(
        lista
    );

    if (window.lucide) {
        window.lucide.createIcons();
    }

}

function inicializarModalBodyListeners() {
    
    if (!modalBody) return;
    
    modalBody.addEventListener("click", (event) => {
        if (event.target.closest(".btn-edit-address")) {
            return;
        }

        const card = event.target.closest(".address-option-card");

        if (!card) {
            return;
        }

        document.querySelectorAll(".address-option-card").forEach(card => {
            card.classList.remove("selecionado");
        });

        card.classList.add("selecionado");

        const id = card.dataset.id;
        const etiqueta = card.dataset.etiqueta;

        salvarConfiguracao(
            "enderecoPadrao",
            {
                id,
                etiqueta
            }
        );

        criarCardEndereco(
            etiqueta
        );
    });

    modalBody.addEventListener("click", (evento) => {

        const botao =
            evento.target.closest(".btn-edit-address");

        if (!botao) {
            return;
        }

        const id = botao.dataset.id;
        sessionStorage.setItem('edit-address', id);

        window.location.href = ROTAS.ENDERECO;
    });
}


// --- Criação do card de produto ---

function criarCard(produto) {

    const card = document.createElement("article");
    card.className = "product-card";
    card.setAttribute("data-id", produto.id);


    // ==============================
    // Cabeçalho do card (badge + ações), acima da imagem, sem sobrepor
    // ==============================

    const topo =
        document.createElement("header");

    topo.className = "product-top";


    // ==============================
    // Badge de desconto
    // ==============================

    if (produto.desconto > 0) {

        const badge =
            document.createElement("mark");

        badge.className =
            "badge discount-badge";

        badge.textContent =
            `${produto.desconto}% OFF`;

        topo.appendChild(badge);
    }


    // ==============================
    // Ações
    // ==============================

    const actions =
    document.createElement("menu");

    actions.className = "actions";

    actions.setAttribute(
        "aria-label",
        "Ações do produto"
    );


    // ==============================
    // Botão de favoritos
    // ==============================

    const favoritoLi =
        document.createElement("li");

    const btnFavorito =
        document.createElement("button");

    btnFavorito.type = "button";
    btnFavorito.className = "btn-icon";
    if (ehFavorito(produto.id)) {
        btnFavorito.classList.add("is-favorite")
    }

    btnFavorito.setAttribute(
        "aria-label",
        "Adicionar aos favoritos"
    );

    const iconeFavorito =
        document.createElement("i");

    iconeFavorito.setAttribute(
        "data-lucide",
        "heart"
    );

    iconeFavorito.setAttribute(
        "aria-hidden",
        "true"
    );

    btnFavorito.appendChild(
        iconeFavorito
    );

    favoritoLi.appendChild(
        btnFavorito
    );


    // ==============================
    // Botão de carrinho
    // ==============================

    const carrinhoLi =
        document.createElement("li");

    const btnCarrinho =
        document.createElement("button");

    btnCarrinho.type = "button";
    btnCarrinho.className = "btn-icon";
    if (estaNoCarrinho(produto.id)) {
        btnCarrinho.classList.add("is-cart");
    }

    btnCarrinho.setAttribute(
        "aria-label",
        "Adicionar ao carrinho"
    );

    const iconeCarrinho =
        document.createElement("i");

    iconeCarrinho.setAttribute(
        "data-lucide",
        "shopping-cart"
    );

    iconeCarrinho.setAttribute(
        "aria-hidden",
        "true"
    );

    btnCarrinho.appendChild(
        iconeCarrinho
    );

    carrinhoLi.appendChild(
        btnCarrinho
    );


    // ==============================
    // Adicionar ao menu
    // ==============================

    actions.append(
        favoritoLi,
        carrinhoLi
    );

    topo.appendChild(actions);



    // ==============================
    // Imagem
    // ==============================

    const imagem =
        document.createElement("img");

    imagem.src = produto.imagem;

    imagem.alt =
        `Foto do ${produto.nome}`;

    imagem.className =
        "product-image";

    const areaImagem =
        document.createElement("div");

    areaImagem.className =
        "product-image-gradient";

    areaImagem.appendChild(imagem);


    // ==============================
    // Informações
    // ==============================

    const info =
        document.createElement("header");

    info.className =
        "product-info";


    const marca =
        document.createElement("span");

    marca.className = "brand";
    marca.textContent = produto.franquia;


    const titulo =
        document.createElement("h3");

    titulo.className = "title";
    titulo.textContent = produto.nome;


    const preco =
    document.createElement("p");

    preco.className = "price";

    const valorFormatado =
        produto.preco.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    preco.textContent = valorFormatado;

    preco.setAttribute(
        "aria-label",
        `Preço: ${produto.preco} reais`
    );


    // ==============================
    // Footer
    // ==============================

    const footer =
        document.createElement("footer");

    footer.className =
        "product-footer";


    const btnComprar =
        document.createElement("button");

    btnComprar.type = "button";
    btnComprar.className = "btn-buy";
    btnComprar.setAttribute(
        "aria-label",
        `Comprar ${produto.nome}`
    );

    const textoComprar =
        document.createElement("span");

    textoComprar.textContent =
        "Comprar";

    btnComprar.appendChild(
        textoComprar
    );

    btnComprar.addEventListener("click", () => {
        const itemCarrinho = buscarItemCarrinho(produto.id);
        const quantidade = itemCarrinho?.quantidade ?? 1;

        const produtosSelecionados = [
            {
                id: produto.id,
                quantidade
            }
        ];

        sessionStorage.setItem(
            "produtosSelecionados",
            JSON.stringify(produtosSelecionados)
        );

        window.location.href = ROTAS.FINALIZAR_PEDIDO;
    });

    const btnAvaliacoes =
        document.createElement("button");

    btnAvaliacoes.type = "button";
    btnAvaliacoes.className = "btn-arrow";

    btnAvaliacoes.setAttribute(
        "aria-label",
        `Ver avaliações de ${produto.nome}`
    );


    const iconeSeta =
        document.createElement("i");

    iconeSeta.setAttribute(
        "data-lucide",
        "chevron-right"
    );

    iconeSeta.setAttribute(
        "aria-hidden",
        "true"
    );

    btnAvaliacoes.appendChild(
        iconeSeta
    );


    footer.append(
        btnComprar,
        btnAvaliacoes
    );


    info.append(
        marca,
        titulo,
        preco,
        footer
    );


    // ==============================
    // Montagem final
    // ==============================

    card.append(
        topo,
        areaImagem,
        info
    );

    return card;
}


// --- Carregamento e renderização do catálogo ---

async function carregarCatalogo() {

    const container =
        document.getElementById("lista-bonecos-firebase");
        
    if (!container) return [];

    try {

        container.setAttribute("aria-busy", "true");
        container.replaceChildren(criarMensagemEstado("Carregando produtos..."));

        const produtos =
            await buscarProdutosAtivos();

        const tipo = obterConfiguracao("tipoOrdenacao");

        switch(tipo) {
            case "alfabetica":
                produtos.sort(
                    (a,b) =>
                    a.nome.localeCompare(b.nome)
                );
                break;
            case "menor-preco":
                produtos.sort(
                    (a,b) =>
                    a.preco - b.preco
                );
                break;
            case "maior-preco":
                produtos.sort(
                    (a,b) =>
                    b.preco - a.preco
                );
                break;
            case "desconto":
                produtos.sort(
                    (a,b) =>
                    b.desconto - a.desconto
                );
                break;
        }

        renderCatalogo(
            produtos,
            container
        );

        return produtos;

    } catch (erro) {

        console.error(
            "Erro ao carregar catálogo:",
            erro
        );

        container.replaceChildren(criarMensagemEstado("Não foi possível carregar os produtos."));

        return [];
    } finally {
        container.setAttribute("aria-busy", "false");
    }
}

function renderCatalogo(lista, container) {

    container.replaceChildren();

    if (!lista.length) {
        container.append(criarMensagemEstado("Nenhum produto disponível no momento."));
        return;
    }

    const fragment =
        document.createDocumentFragment();

    lista.forEach(produto => {

        const card =
            criarCard(produto);

        fragment.appendChild(card);

    });

    container.appendChild(fragment);

    if (window.lucide) {
        window.lucide.createIcons();
    }

    const status =
        document.getElementById(
            "status-catalogo"
        );

    if (status) {
        status.textContent =
            `${lista.length} produto(s)`;
    }
}

function inicializarListenersProdutos() {
    
    if (!listaProdutos) return;

    // Favoritar (delegação de eventos)
    listaProdutos.addEventListener("click", (event) => {
        const botao = event.target.closest(".actions li:first-child button");

        if (!botao) {
            return;
        }

        const article = botao.closest(".product-card");

        const idProduto = article.dataset.id;

        botao.classList.toggle("is-favorite");

        toggleFavorito(idProduto);
    });

    // Adicionar/remover do carrinho (delegação de eventos)
    listaProdutos.addEventListener("click", (event) => {
        const botao = event.target.closest(".actions li:last-child button");

        if (!botao) {
            return;
        }

        const article = botao.closest(".product-card");

        const idProduto = article.dataset.id;

        botao.classList.toggle("is-cart");

        toggleCarrinho(idProduto);

        if (estaNoCarrinho(idProduto)) {
            mostrarToastCarrinho();
        }
        configurarCarrinho();
    });

    // Navegação para a página de avaliação
    listaProdutos.addEventListener("click", (event) => {
        const botao = event.target.closest(".btn-arrow");

        if (!botao) {
            return;
        }

        const article = botao.closest(".product-card");
        const idProduto = article.dataset.id;

        sessionStorage.setItem("produtoId", idProduto);

        window.location.href = ROTAS.AVALIACAO_PRODUTO;
    });
}

// #endregion


// #region Acompanhamento e avaliação de pedidos

const sliderPedidos = document.getElementById("orders-slider");
const controlesPedidos = document.getElementById("orders-controls");
const posicaoPedido = document.getElementById("order-position");
const cardPedidos = document.getElementById("orders-card");
const modalAvaliacao = document.getElementById("order-review-dialog");
const formularioAvaliacao = document.getElementById("order-review-form");
const listaProdutosAvaliacao = document.getElementById("order-review-products");
const feedbackAvaliacao = document.getElementById("order-review-feedback");

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function obterFluxoPedido(pedido) {
    const retirada = normalizarTexto(pedido.formaEntrega).includes("retir");
    const status = normalizarTexto(pedido.status);
    const criadoEm = converterDataPedido(pedido.criadoEm);
    const diasDecorridos = criadoEm.getTime() > 0
        ? Math.max(0, Math.floor((Date.now() - criadoEm.getTime()) / 86400000))
        : 0;
    const concluidoPorStatus = ["entregue", "retirado", "concluido", "finalizado"].some(valor => status.includes(valor));
    const cancelado = status.includes("cancel");
    let etapaStatus = 1;

    if (["confirmado", "aprovado", "pago"].some(valor => status.includes(valor))) etapaStatus = 2;
    if (["preparando", "preparo", "separacao", "separando"].some(valor => status.includes(valor))) etapaStatus = 3;
    if (["enviado", "transporte", "saiu para entrega", "pronto", "disponivel"].some(valor => status.includes(valor))) etapaStatus = 4;
    if (concluidoPorStatus) etapaStatus = 5;

    const etapaTempo = Math.min(5, diasDecorridos + 1);
    const concluidoPorTempo = !retirada && criadoEm.getTime() > 0 && diasDecorridos >= 5;
    const concluido = !cancelado && (concluidoPorStatus || concluidoPorTempo);
    const etapa = cancelado ? 0 : retirada ? 1 : concluido ? 5 : Math.max(etapaStatus, etapaTempo);
    const totalEtapas = retirada ? 1 : 5;

    const mensagensEntrega = [
        "Recebemos seu pedido!",
        "Pagamento confirmado. :) ",
        "Seu pedido está sendo preparado.",
        "Seu pedido está quase chegando!",
        "Seu pedido chegou! :)"
    ];
    const dataPrevista = new Date(criadoEm);
    dataPrevista.setDate(dataPrevista.getDate() + 5);
    const previsaoFormatada = criadoEm.getTime() > 0
        ? dataPrevista.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
        : null;
    const etapaMensagem = concluido ? 5 : Math.min(4, etapa);
    const mensagemRetirada = concluidoPorStatus
        ? "Pedido retirado. Esperamos que goste!"
        : "Seu pedido está esperando a retirada na loja.";
    const detalheEntrega = concluido
        ? "Entrega concluída • produtos disponíveis para avaliação"
        : previsaoFormatada
            ? `Dia ${diasDecorridos + 1} de 5 • chegada prevista para ${previsaoFormatada}`
            : "Prazo estimado de entrega: cinco dias";
    const detalheRetirada = concluidoPorStatus
        ? "Retirada concluída • produtos disponíveis para avaliação"
        : "Aguardando retirada no balcão da loja";

    return {
        retirada,
        concluido,
        cancelado,
        etapa: cancelado ? 0 : etapa,
        totalEtapas,
        mensagem: cancelado ? "Este pedido foi cancelado." : retirada ? mensagemRetirada : mensagensEntrega[etapaMensagem - 1],
        detalhe: cancelado ? "A progressão deste pedido foi interrompida" : retirada ? detalheRetirada : detalheEntrega,
        icone: cancelado ? "circle-x" : retirada ? "store" : etapa >= 4 ? "truck" : "package-check"
    };
}

function converterDataPedido(valor) {
    if (valor?.toDate) return valor.toDate();
    const data = new Date(valor ?? 0);
    return Number.isNaN(data.getTime()) ? new Date(0) : data;
}

async function carregarProdutosDoPedido(pedido) {
    if (pedido.produtosDetalhados) return pedido.produtosDetalhados;
    const itens = Array.isArray(pedido.produtos) ? pedido.produtos : [];
    pedido.produtosDetalhados = (await Promise.all(
        itens.map(async item => {
            const produtoId = item?.produtoId ?? item?.id;
            if (!produtoId) return null;
            const produto = await buscarProdutoPorId(produtoId);
            return produto ? { produto, quantidade: Number(item.quantidade) || 1 } : null;
        })
    )).filter(Boolean);
    return pedido.produtosDetalhados;
}

function criarResumoProdutos(produtos) {
    const lista = criarElemento("ul", "order-products-list");
    lista.setAttribute("aria-label", `${produtos.length} produto${produtos.length === 1 ? "" : "s"} neste pedido`);

    produtos.forEach(item => {
        const produto = item.produto;
        const card = criarElemento("li", "order-product-bubble");

        if (produto?.imagem) {
            const imagem = document.createElement("img");
            imagem.src = produto.imagem;
            imagem.alt = "";
            card.append(imagem);
        } else {
            const icone = document.createElement("i");
            icone.dataset.lucide = "package";
            icone.setAttribute("aria-hidden", "true");
            card.append(icone);
        }

        const quantidade = item.quantidade > 1 ? ` (${item.quantidade}x)` : "";
        card.append(criarElemento("span", "bubble-text", `${produto?.nome ?? "Produto"}${quantidade}`));
        lista.append(card);
    });

    return lista;
}

async function renderizarPedidoAtual() {
    if (!sliderPedidos || !pedidosDoUsuario.length) return;
    const pedido = pedidosDoUsuario[indicePedidoAtual];
    const fluxo = obterFluxoPedido(pedido);
    const produtos = await carregarProdutosDoPedido(pedido);
    if (pedido !== pedidosDoUsuario[indicePedidoAtual]) return;

    const conteudo = criarElemento("article", "order-slide");
    conteudo.setAttribute("aria-label", `Pedido ${indicePedidoAtual + 1} de ${pedidosDoUsuario.length}`);
    conteudo.append(criarResumoProdutos(produtos));

    const status = criarElemento("section", `order-status-wrapper${fluxo.cancelado ? " order-cancelled" : ""}`);
    const icone = document.createElement("i");
    icone.dataset.lucide = fluxo.icone;
    icone.className = "status-icon";
    icone.setAttribute("aria-hidden", "true");
    status.append(icone, criarElemento("h4", "status-text", fluxo.mensagem));
    conteudo.append(status);

    const progresso = criarElemento("div", "order-progress-bar");
    progresso.setAttribute("role", "progressbar");
    progresso.setAttribute("aria-label", fluxo.cancelado ? "Pedido cancelado" : `Etapa ${fluxo.etapa} de ${fluxo.totalEtapas}`);
    progresso.setAttribute("aria-valuemin", "0");
    progresso.setAttribute("aria-valuemax", String(fluxo.totalEtapas));
    progresso.setAttribute("aria-valuenow", String(fluxo.etapa));
    for (let etapa = 1; etapa <= fluxo.totalEtapas; etapa += 1) {
        progresso.append(criarElemento("span", `progress-step${etapa <= fluxo.etapa ? " active" : ""}`));
    }
    conteudo.append(progresso);

    const detalhes = criarElemento("p", "order-delivery-kind", fluxo.detalhe);
    conteudo.append(detalhes);

    if (fluxo.concluido && !pedido.avaliado && produtos.length) {
        const avaliar = criarElemento("button", "btn-evaluate", "Avaliar produtos");
        avaliar.type = "button";
        avaliar.addEventListener("click", event => abrirAvaliacaoPedido(pedido, produtos, event.currentTarget));
        conteudo.append(avaliar);
    }

    sliderPedidos.replaceChildren(conteudo);
    controlesPedidos.hidden = pedidosDoUsuario.length < 2;
    posicaoPedido.textContent = `${indicePedidoAtual + 1} de ${pedidosDoUsuario.length}`;
    inicializarIconesLucide();
}

function mostrarEstadoSemPedidos() {
    const vazio = criarElemento("section", "orders-empty");
    vazio.append(criarElemento("h4", "", "Os status dos seus pedidos aparecerão aqui."));
    const botao = criarElemento("button", "btn-orders", "Fazer pedido");
    botao.type = "button";
    botao.addEventListener("click", () => listaProdutos?.scrollIntoView({ behavior: "smooth" }));
    vazio.append(botao);
    sliderPedidos.replaceChildren(vazio);
    controlesPedidos.hidden = true;
}

function reiniciarRotacaoPedidos() {
    clearInterval(temporizadorPedidos);
    if (pedidosDoUsuario.length > 1 && !rotacaoPedidosPausada) {
        temporizadorPedidos = setInterval(() => navegarPedidos(1, false), 7000);
    }
}

function alternarRotacaoPedidos() {
    rotacaoPedidosPausada = !rotacaoPedidosPausada;
    const botao = document.getElementById("toggle-orders-rotation");
    botao.setAttribute("aria-pressed", String(rotacaoPedidosPausada));
    botao.setAttribute("aria-label", `${rotacaoPedidosPausada ? "Retomar" : "Pausar"} troca automática de pedidos`);
    const icone = document.createElement("i");
    icone.dataset.lucide = rotacaoPedidosPausada ? "play" : "pause";
    icone.setAttribute("aria-hidden", "true");
    botao.replaceChildren(icone);
    inicializarIconesLucide();
    reiniciarRotacaoPedidos();
}

function navegarPedidos(direcao, reiniciar = true) {
    if (pedidosDoUsuario.length < 2) return;
    indicePedidoAtual = (indicePedidoAtual + direcao + pedidosDoUsuario.length) % pedidosDoUsuario.length;
    renderizarPedidoAtual();
    if (reiniciar) reiniciarRotacaoPedidos();
}

async function carregarPedidosHome() {
    if (!sliderPedidos) return;
    try {
        const usuario = await aguardarUsuario();
        if (!usuario?.uid) return mostrarEstadoSemPedidos();
        pedidosDoUsuario = (await listarPedidosUsuario(usuario.uid))
            .filter(pedido => !pedido.avaliado)
            .sort((a, b) => converterDataPedido(b.criadoEm) - converterDataPedido(a.criadoEm));
        if (!pedidosDoUsuario.length) return mostrarEstadoSemPedidos();
        indicePedidoAtual = 0;
        await renderizarPedidoAtual();
        reiniciarRotacaoPedidos();
    } catch (erro) {
        console.error("Erro ao carregar pedidos:", erro);
        sliderPedidos.replaceChildren(criarMensagemEstado("Não foi possível carregar seus pedidos agora."));
    }
}

function criarCampoAvaliacao(item, indice) {
    const fieldset = criarElemento("fieldset", "review-product");
    fieldset.dataset.produtoId = item.produto.id;
    const legenda = criarElemento("legend", "sr-only", `Avaliação de ${item.produto.nome}`);
    const cabecalho = criarElemento("div", "review-product-header");
    if (item.produto.imagem) {
        const imagem = document.createElement("img");
        imagem.src = item.produto.imagem;
        imagem.alt = "";
        cabecalho.append(imagem);
    }
    cabecalho.append(criarElemento("strong", "", item.produto.nome));
    const estrelas = criarElemento("div", "review-stars");
    estrelas.setAttribute("role", "group");
    estrelas.setAttribute("aria-label", `Nota para ${item.produto.nome}`);
    const inputNota = document.createElement("input");
    inputNota.type = "hidden";
    inputNota.name = `nota-${indice}`;
    inputNota.value = "";
    estrelas.append(inputNota);

    for (let nota = 1; nota <= 5; nota += 1) {
        const botaoEstrela = criarElemento("button", "review-star-button", "★");
        botaoEstrela.type = "button";
        botaoEstrela.dataset.nota = String(nota);
        botaoEstrela.setAttribute("aria-label", `${nota} estrela${nota > 1 ? "s" : ""}`);
        botaoEstrela.setAttribute("aria-pressed", "false");
        botaoEstrela.addEventListener("click", () => {
            inputNota.value = String(nota);
            estrelas.querySelectorAll(".review-star-button").forEach(estrela => {
                const selecionada = Number(estrela.dataset.nota) <= nota;
                estrela.classList.toggle("selected", selecionada);
                estrela.setAttribute("aria-pressed", String(Number(estrela.dataset.nota) === nota));
            });
            feedbackAvaliacao.textContent = "";
        });
        estrelas.append(botaoEstrela);
    }
    const labelComentario = criarElemento("label", "review-comment-label", "Comentário (opcional)");
    const comentario = document.createElement("textarea");
    comentario.name = `comentario-${indice}`;
    comentario.rows = 3;
    comentario.maxLength = 500;
    comentario.placeholder = "Conte o que achou deste produto";
    labelComentario.append(comentario);
    fieldset.append(legenda, cabecalho, estrelas, labelComentario);
    return fieldset;
}

function abrirAvaliacaoPedido(pedido, produtos, botao) {
    pedidoEmAvaliacao = pedido;
    botaoAvaliacaoAtivo = botao;
    feedbackAvaliacao.textContent = "";
    listaProdutosAvaliacao.replaceChildren(...produtos.map(criarCampoAvaliacao));
    clearInterval(temporizadorPedidos);
    modalAvaliacao.showModal();
    inicializarIconesLucide();
}

function fecharAvaliacaoPedido() {
    modalAvaliacao.close();
    formularioAvaliacao.reset();
    pedidoEmAvaliacao = null;
    botaoAvaliacaoAtivo?.focus();
    botaoAvaliacaoAtivo = null;
    reiniciarRotacaoPedidos();
}

function mostrarToastPedido(mensagem) {
    document.querySelector(".order-toast")?.remove();
    const toast = criarElemento("aside", "order-toast");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");

    const iconeContainer = criarElemento("span", "order-toast-icon");
    iconeContainer.setAttribute("aria-hidden", "true");
    const icone = document.createElement("i");
    icone.dataset.lucide = "circle-check";
    iconeContainer.append(icone);

    const conteudo = criarElemento("p", "order-toast-content", mensagem);

    const fechar = criarElemento("button", "order-toast-close");
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar confirmação");
    const iconeFechar = document.createElement("i");
    iconeFechar.dataset.lucide = "x";
    iconeFechar.setAttribute("aria-hidden", "true");
    fechar.append(iconeFechar);

    toast.append(iconeContainer, conteudo, fechar);
    document.body.append(toast);
    inicializarIconesLucide();

    let removido = false;
    const remover = () => {
        if (removido) return;
        removido = true;
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    };
    fechar.addEventListener("click", remover);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(remover, 5000);
}

async function enviarAvaliacoes(event) {
    event.preventDefault();
    if (!pedidoEmAvaliacao) return;
    const usuario = await aguardarUsuario();
    if (!usuario?.uid) return;
    const botaoEnviar = formularioAvaliacao.querySelector(".btn-review-submit");
    const campos = [...listaProdutosAvaliacao.querySelectorAll(".review-product")];
    const campoSemNota = campos.find((campo, indice) => !campo.querySelector(`input[name="nota-${indice}"]`)?.value);
    if (campoSemNota) {
        feedbackAvaliacao.textContent = "Selecione de 1 a 5 estrelas para todos os produtos.";
        campoSemNota.querySelector(".review-star-button")?.focus();
        return;
    }
    botaoEnviar.disabled = true;
    feedbackAvaliacao.textContent = "Enviando suas avaliações...";
    try {
        const avaliacoes = campos.map((campo, indice) => {
            const nota = Number(campo.querySelector(`input[name="nota-${indice}"]`).value);
            const comentario = campo.querySelector(`textarea[name="comentario-${indice}"]`).value.trim();
            return new Avaliacao(null, comentario, new Date().toISOString(), nota, campo.dataset.produtoId, usuario.uid);
        });
        await criarAvaliacoesPedido(avaliacoes, pedidoEmAvaliacao.id);
        const idAvaliado = pedidoEmAvaliacao.id;
        modalAvaliacao.close();
        formularioAvaliacao.reset();
        pedidoEmAvaliacao = null;
        botaoAvaliacaoAtivo = null;
        pedidosDoUsuario = pedidosDoUsuario.filter(pedido => pedido.id !== idAvaliado);
        indicePedidoAtual = Math.min(indicePedidoAtual, Math.max(0, pedidosDoUsuario.length - 1));
        pedidosDoUsuario.length ? await renderizarPedidoAtual() : mostrarEstadoSemPedidos();
        reiniciarRotacaoPedidos();
        mostrarToastPedido("Avaliações enviadas. Obrigado pela sua opinião!");
    } catch (erro) {
        console.error("Erro ao avaliar pedido:", erro);
        feedbackAvaliacao.textContent = "Não foi possível enviar as avaliações. Tente novamente.";
    } finally {
        botaoEnviar.disabled = false;
    }
}

function inicializarPedidosHome() {
    document.getElementById("previous-order")?.addEventListener("click", () => navegarPedidos(-1));
    document.getElementById("next-order")?.addEventListener("click", () => navegarPedidos(1));
    document.getElementById("toggle-orders-rotation")?.addEventListener("click", alternarRotacaoPedidos);
    cardPedidos?.addEventListener("mouseenter", () => clearInterval(temporizadorPedidos));
    cardPedidos?.addEventListener("mouseleave", reiniciarRotacaoPedidos);
    cardPedidos?.addEventListener("focusin", () => clearInterval(temporizadorPedidos));
    cardPedidos?.addEventListener("focusout", event => {
        if (!cardPedidos.contains(event.relatedTarget)) reiniciarRotacaoPedidos();
    });
    document.getElementById("close-order-review")?.addEventListener("click", fecharAvaliacaoPedido);
    document.getElementById("cancel-order-review")?.addEventListener("click", fecharAvaliacaoPedido);
    modalAvaliacao?.addEventListener("cancel", event => {
        event.preventDefault();
        fecharAvaliacaoPedido();
    });
    formularioAvaliacao?.addEventListener("submit", enviarAvaliacoes);
    carregarPedidosHome();
}

// #endregion


// #region Métodos de inicialização


inicializarNavegacaoCarrinho();
configurarEndereco();
configurarOrdem();
configurarCarrinho();
inicializarIconesLucide();

await carregarCatalogo();
hrefPesquisa();
hrefEndereco();
hrefFiltro();

bannerFechado = !(await configurarPromocaoPrimeiraCompra({
    banner,
    header,
    conteudo: document.querySelector(".main-content")
}));
inicializarBanner();
configurarPesquisaCabecalho({
    input: inputBusca,
    aoPesquisar: filtrarPorNome,
    pesquisarAoDigitar: true
});
inicializarPopupFiltro();
inicializarFiltroMenu();
inicializarModalEndereco();
inicializarBtnConfirmar();
inicializarModalBodyListeners();
inicializarListenersProdutos();
inicializarPedidosHome();

// #endregion
