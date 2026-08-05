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
// #endregion


// #region Verificação de acesso (login obrigatório)
verificarLogin();

async function verificarAcesso() {

    const usuario =
        await verificarLogin();

    if (!usuario) {
        window.location.href =
            "login.html";

        return;
    }
}
// #endregion


// #region Inicialização de ícones (lucide)
if (window.lucide) {
    window.lucide.createIcons();
}
// #endregion


// #region Seleção de elementos do DOM
const btnAbrirModal = document.querySelector('.btn-change-address');
const modalEndereco = document.getElementById('modal-endereco');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const banner = document.querySelector('.promo-banner');
const searchForm = document.querySelector('.search-form');
const listaProdutos = document.querySelector("#lista-bonecos-firebase");
const inputBusca = document.getElementById('search-input');
const btnMicrofone = document.querySelector('.mic-btn');
let bannerFechado = false;
let timeoutToast = null;
// #endregion


// #region Carregamento inicial da página
await carregarCatalogo()
hrefPesquisa();
hrefEndereco();
// #endregion


// #region Pesquisa por voz (Speech Recognition)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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
// #endregion


// #region Banner promocional
function alternarBanner() {
    bannerFechado = true;

    banner.classList.add("oculto");

    document.querySelector('.header').classList.add('sem-banner');

    document.querySelector('.main-content').style.marginTop = "160px";
}

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
// #endregion


// #region Toast de carrinho
export function mostrarToastCarrinho(
    mensagem = "Produto adicionado ao carrinho com sucesso!"
) {
    const header = document.querySelector('.header');
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
            window.location.href = "carrinho.html";
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

// #endregion

// #region Popup diferentes listagens produtos
const btnFiltro = document.getElementById('btn-filter');
const popupFiltro = document.getElementById('filter-popup');
const btnOpcoesFiltro = document.querySelectorAll('.btn-filter-option');

btnFiltro.addEventListener('click', (event) => {
    event.stopPropagation(); 
    const estaAberto = btnFiltro.getAttribute('aria-expanded') === 'true';
    
    if (estaAberto) {
        fecharPopupFiltro();
    } else {
        abrirPopupFiltro();
    }
});

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
// #endregion

// #region Formulário de busca (submit)
const header = document.querySelector('.header');

searchForm.addEventListener('submit', (event) => {
    event.preventDefault(); 
})
// #endregion


// #region Navegação vinda de outras páginas (sessionStorage)
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

    // Implementar 
    modalEndereco.showModal();
    carregarEnderecos();

    sessionStorage.removeItem("href-endereco");
}
// #endregion


// #region Modal de endereço
if (btnAbrirModal && modalEndereco) {
    btnAbrirModal.addEventListener('click', () => {
        modalEndereco.showModal();
        carregarEnderecos();
    });

    btnFecharModal.addEventListener('click', () => {
        modalEndereco.close();
    });

    modalEndereco.addEventListener('click', (event) => {
        if (event.target === modalEndereco) {
            modalEndereco.close();
        }
    });
}



const btnIrParaCadastro = document.querySelector('.btn-adicionar');

btnIrParaCadastro.addEventListener('click', () => {
    window.location.href = "endereco.html";
})


async function carregarEnderecos() {
    const uid = obterUid();

    if (!uid) {
        return;
    }

    const enderecos = await listarEnderecos(uid);
}
// #endregion


// #region Criação do card de produto
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
// #endregion


// #region Carregamento e renderização do catálogo
async function carregarCatalogo() {

    const container =
        document.getElementById("lista-bonecos-firebase");

    try {

        container.innerHTML = `
            <p>Carregando produtos...</p>
        `;

        const produtos =
            await buscarProdutosAtivos();

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
// #endregion


// #region Listeners de favoritos e carrinho (delegação de eventos)
listaProdutos.addEventListener("click", (event) => {
    const botao = event.target.closest(".actions li:first-child button");

    if (!botao) {
        return;
    }

    const article = botao.closest(".product-card");

    const idProduto = article.dataset.id;

    botao.classList.toggle("is-favorite");

    toggleFavorito(idProduto)
});

listaProdutos.addEventListener("click", (event) => {
    const botao = event.target.closest(".actions li:last-child button");

    if (!botao) {
        return;
    }

    const article = botao.closest(".product-card");

    const idProduto = article.dataset.id;

    botao.classList.toggle("is-cart");

    toggleCarrinho(idProduto)

    if (estaNoCarrinho(idProduto)) {
        mostrarToastCarrinho();
    }
});
// #endregion


// #region Filtro de busca por nome
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

inputBusca.addEventListener("input", (event) => {
    filtrarPorNome(
        inputBusca.value.trim()
    )
})

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


// #endregion

function inicializarNavegacaoCarrinho() {
    const btnHeaderCarrinho = document.querySelector('button[aria-label="Ver meu carrinho"]');
    if (btnHeaderCarrinho) {
        btnHeaderCarrinho.addEventListener('click', () => {
            window.location.href = "carrinho.html";
        });
    }

    const cartCard = document.querySelector('.cart-card');
    if (cartCard) {
        cartCard.addEventListener('click', () => {
            window.location.href = "carrinho.html";
        });
    }
}

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
inicializarNavegacaoCarrinho();

// #endregion