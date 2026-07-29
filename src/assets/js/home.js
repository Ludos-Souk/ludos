import {
    buscarProdutosAtivos
} from "../../services/produtoService.js";
import {
    toggleFavorito,
    ehFavorito
} from "../../services/favoritosService.js";
import { 
    verificarLogin 
} from "../../services/authService.js";

async function verificarAcesso() {

    const usuario =
        await verificarLogin();

    if (!usuario) {
        window.location.href =
            "login.html";

        return;
    }
}

verificarAcesso();
carregarCatalogo()

if (window.lucide) {
    window.lucide.createIcons();
}

const listaProdutos = document.querySelector("#lista-bonecos-firebase");
const inputBusca = document.getElementById('search-input');
const btnMicrofone = document.querySelector('.mic-btn');

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

function alternarBanner() {
    const banner = document.getElementById('promo-banner');

    banner.remove();

    document.querySelector('.header').classList.add('sem-banner');

    document.querySelector('.main-content').style.marginTop="160px";
}

window.alternarBanner = alternarBanner;

const header = document.querySelector('.header');
const banner = document.querySelector('.promo-banner');

window.addEventListener("scroll", () => {
    if (!banner) return;

    if (window.scrollY > 30) {
        banner.classList.add("compact");
    } else {
        banner.classList.remove("compact");
    }
});

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