// #region Imports
import {
    buscarProdutosAtivos
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
    listarEnderecos
} from "../../services/usuarioService.js";
import {
    toggleCarrinho,
    estaNoCarrinho
} from "../../services/carrinhoService.js";
import {
    existeConfiguracao,
    obterConfiguracao,
    salvarConfiguracao,
    removerConfiguracao
} from "../../services/configuracoesService.js";
// #endregion


// #region Variáveis

// Modal de endereço
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
const searchForm = document.querySelector('.search-form');
const inputBusca = document.getElementById('search-input');
const btnMicrofone = document.querySelector('.mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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

// #endregion


// #region Métodos

// --- Acesso / configurações salvas ---

async function verificarAcesso() {
    const usuario =
        await verificarLogin();

    if (!usuario) {
        window.location.href =
            "login.html";

        return;
    }
}

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
    botao.classList.add("selecionado");
}

function inicializarIconesLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}


// --- Toast de carrinho ---

export function mostrarToastCarrinho(
    mensagem = "Produto adicionado ao carrinho com sucesso!"
) {
    const mainContent = document.querySelector('.main-content'); // Seleciona a tag main

    if (!bannerFechado) {
        banner.classList.add("oculto");
    }

    // Traz de volta o espaço no cabeçalho e empurra o conteúdo para baixo
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

    toast.innerHTML = `
        <span class="cart-toast-content">
            <span class="cart-toast-icon" aria-hidden="true">
                <i data-lucide="check"></i>
            </span>
            <p>${mensagem}</p>
        </span>
        <span class="cart-toast-actions">
            <button type="button" class="btn-go-cart">Ir para carrinho</button>
            <button type="button" class="btn-close-toast" aria-label="Fechar aviso">
                <i data-lucide="x"></i>
            </button>
        </span>
    `;

    header.appendChild(toast);

    if (window.scrollY > 30) {
        toast.classList.add("compact");
    }

    if (window.lucide) {
        lucide.createIcons();
    }

    toast
        .querySelector(".btn-close-toast")
        .addEventListener("click", () => {
            toast.remove();

            if (!bannerFechado) {
                banner.classList.remove("oculto");
            } else {
                header.classList.add("sem-banner");
                mainContent.style.marginTop = "160px";
            }
        });

    toast
        .querySelector(".btn-go-cart")
        .addEventListener("click", () => {
            alert("Parte ainda não implementada. Redirecionar para a página do carrinho.");
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


// --- Pesquisa por voz (Speech Recognition) ---

function inicializarPesquisaPorVoz() {
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;

        recognition.onstart = function() {
            btnMicrofone.style.color = 'blue';
        };

        recognition.onresult = function(event) {
            const textoFalado = event.results[0][0].transcript;
            inputBusca.value = textoFalado;
        };

        recognition.onend = function() {
            btnMicrofone.style.color = '#888';
        };

        recognition.onerror = function(event) {
            alert("Erro no reconhecimento:" + event.error);
        };

        btnMicrofone.addEventListener('click', function() {
            recognition.start();
        });

    } else {
        alert("Seu navegador não tem suporte para pesquisa por voz.");
    }
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


// --- Formulário de busca ---

function inicializarFormularioBusca() {
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
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

function inicializarFiltroBusca() {
    inputBusca.addEventListener("input", (event) => {
        filtrarPorNome(
            inputBusca.value.trim()
        );
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

    const enderecos = await listarEnderecos(uid);
    if (enderecos.length) {
        carregarListaEnderecos(enderecos);
    }
}

function inicializarModalEndereco() {
    sideCards.addEventListener("click", (event) => {

        const botao =
            event.target.closest(".btn-change-address");

        if (!botao) {
            return;
        }

        abrirModalEndereco();
        carregarEnderecos();

    });

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

    btnIrParaCadastro.addEventListener('click', () => {
        window.location.href = "endereco.html";
    });
}

function inicializarBtnConfirmar() {
    btnConfirmar.addEventListener('click', () => {
        document.body.classList.remove("modal-open");
        modalEndereco.close();
    });
}

function criarCardEndereco(etiqueta) {

    document.querySelector('.card.address-card')?.remove();

    const sideCards =
        document.querySelector(
            ".side-cards"
        );

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

    modalBody.classList.remove(
        "modal-body-empty"
    );

    modalBody.innerHTML = "";

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

        window.location.href = "endereco.html";
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
        imagem,
        info
    );

    return card;
}


// --- Carregamento e renderização do catálogo ---

async function carregarCatalogo() {

    const container =
        document.getElementById("lista-bonecos-firebase");

    try {

        container.innerHTML = `
            <p>Carregando produtos...</p>
        `;

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

        container.innerHTML = `
            <p>
                Não foi possível carregar
                os produtos.
            </p>
        `;

        return [];
    }
}

function renderCatalogo(lista, container) {

    container.innerHTML = "";

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

        window.location.href = `avaliacaoProduto.html`;
    });
}

// #endregion


// #region Métodos de inicialização

verificarAcesso();

configurarEndereco();
configurarOrdem();
inicializarIconesLucide();

await carregarCatalogo();
hrefPesquisa();
hrefEndereco();

inicializarPesquisaPorVoz();
inicializarBanner();
inicializarPopupFiltro();
inicializarFiltroMenu();
inicializarFormularioBusca();
inicializarFiltroBusca();
inicializarModalEndereco();
inicializarBtnConfirmar();
inicializarModalBodyListeners();
inicializarListenersProdutos();

// #endregion