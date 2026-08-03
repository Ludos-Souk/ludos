// #region Imports
import { verificarLogin } from "../../services/authService.js";
import { estaNoCarrinho, toggleCarrinho } from "../../services/carrinhoService.js";
import { ehFavorito, toggleFavorito } from "../../services/favoritosService.js";
import { buscarProdutoPorId, buscarProdutosAtivos } from "../../services/produtoService.js";
// #endregion

// #region Verificação de acesso
const usuario = await verificarLogin();
if (!usuario) {
    window.location.href = "login.html";
}
// #endregion

// #region Inicialização de ícones
if (window.lucide) {
    window.lucide.createIcons();
}
// #endregion

// #region Seleção de elementos do DOM
const banner        = document.querySelector('.promo-banner');
const btnVoltar     = document.getElementById('btn-voltar');
let bannerFechado   = false;
// #endregion

// #region Banner promocional (mesmo comportamento da home)
function alternarBanner() {
    bannerFechado = true;
    banner.classList.add("oculto");
    document.querySelector('.header').classList.add('sem-banner');
    document.querySelector('.main-content').style.marginTop = "160px";
}
window.alternarBanner = alternarBanner;

window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
        banner?.classList.add("compact");
    } else {
        banner?.classList.remove("compact");
    }
});
// #endregion

// #region Botão voltar
btnVoltar.addEventListener('click', () => {
    window.history.back();
});
// #endregion

// #region Leitura do id na URL e carregamento do produto
const params    = new URLSearchParams(window.location.search);
const idProduto = params.get("id");

if (!idProduto) {
    window.location.href = "home.html";
}

const [produto, todosProdutos] = await Promise.all([
    buscarProdutoPorId(idProduto),
    buscarProdutosAtivos()
]);

if (!produto) {
    document.getElementById("produto-detalhe").innerHTML =
        `<p style="padding:40px;color:#888;">Produto não encontrado.</p>`;
} else {
    await renderProduto(produto);
    renderRelacionados(todosProdutos, idProduto);
}
// #endregion

// #region Render do produto
async function renderProduto(produto) {
    const container = document.getElementById("produto-detalhe");

    const precoFormatado = produto.preco.toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
    });

    const precoParcela = (produto.preco / 3).toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
    });

    const badgeHtml = produto.desconto > 0
        ? `<span class="produto-badge-desconto">${produto.desconto}% OFF</span>`
        : "";

    const favoritoAtivo = ehFavorito(produto.id) ? "is-favorite" : "";
    const carrinhoAtivo = estaNoCarrinho(produto.id) ? "is-cart" : "";

    container.innerHTML = `
        <!-- Coluna esquerda: imagem + nome + descrição -->
        <div class="produto-col-imagem">
            <img
                src="${produto.imagem}"
                alt="Foto de ${produto.nome}"
                class="produto-imagem-principal"
            >
            <h3 class="produto-nome-detalhe">${produto.nome}</h3>
        </div>

        <!-- Coluna central: ações, preço, quantidade, comprar -->
        <div class="produto-col-info">
            <div class="produto-topo-acoes">
                ${badgeHtml}
                <button
                    type="button"
                    class="btn-icon ${favoritoAtivo}"
                    id="btn-favorito-detalhe"
                    aria-label="Adicionar aos favoritos"
                >
                    <i data-lucide="heart" aria-hidden="true"></i>
                </button>
                <button
                    type="button"
                    class="btn-icon ${carrinhoAtivo}"
                    id="btn-carrinho-detalhe"
                    aria-label="Adicionar ao carrinho"
                >
                    <i data-lucide="shopping-cart" aria-hidden="true"></i>
                </button>
            </div>

            <p class="produto-preco-principal">${precoFormatado}</p>
            <p class="produto-preco-parcelado">Ou 3x de ${precoParcela}</p>

            <div class="produto-quantidade">
                <button type="button" class="btn-qtd" id="btn-menos" aria-label="Diminuir quantidade">
                    <i data-lucide="minus" aria-hidden="true"></i>
                </button>
                <span class="qtd-valor" id="qtd-valor">1</span>
                <button type="button" class="btn-qtd" id="btn-mais" aria-label="Aumentar quantidade">
                    <i data-lucide="plus" aria-hidden="true"></i>
                </button>
            </div>

            <p class="produto-estoque">Disponíveis: ${produto.estoque}</p>

            <button type="button" class="btn-comprar-detalhe">Comprar</button>
        </div>

        <!-- Coluna direita: avaliações -->
        <div class="produto-col-avaliacoes">
            <h3 class="avaliacoes-titulo">
                <i data-lucide="message-circle" aria-hidden="true"></i>
                Avaliações
            </h3>
            <div class="avaliacoes-lista" id="avaliacoes-lista">
                <p class="sem-avaliacoes">Carregando avaliações...</p>
            </div>
        </div>
    `;

    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Quantidade
    let qtd = 1;
    document.getElementById("btn-mais").addEventListener("click", () => {
        if (qtd < produto.estoque) {
            qtd++;
            document.getElementById("qtd-valor").textContent = qtd;
        }
    });
    document.getElementById("btn-menos").addEventListener("click", () => {
        if (qtd > 1) {
            qtd--;
            document.getElementById("qtd-valor").textContent = qtd;
        }
    });

    // Favorito
    document.getElementById("btn-favorito-detalhe").addEventListener("click", (e) => {
        e.currentTarget.classList.toggle("is-favorite");
        toggleFavorito(produto.id);
    });

    // Carrinho
    document.getElementById("btn-carrinho-detalhe").addEventListener("click", (e) => {
        e.currentTarget.classList.toggle("is-cart");
        toggleCarrinho(produto.id);
    });

    // Avaliações
    await carregarAvaliacoes(produto.id);
}
// #endregion

// #region Avaliações
async function carregarAvaliacoes(idProduto) {
    const lista = document.getElementById("avaliacoes-lista");

    try {
        const avaliacoes = await listarAvaliacoesProduto(idProduto);

        if (!avaliacoes || avaliacoes.length === 0) {
            lista.innerHTML = `<p class="sem-avaliacoes">Nenhuma avaliação ainda.</p>`;
            return;
        }

        lista.innerHTML = avaliacoes.map(av => `
            <article class="avaliacao-card">
                <div class="avaliacao-autor">
                    <i data-lucide="circle-user" aria-hidden="true"></i>
                    ${av.nomeUsuario ?? "Usuário"}
                </div>
                <p class="avaliacao-texto">${av.comentario ?? ""}</p>
                <div class="avaliacao-estrelas" aria-label="${av.nota} de 5 estrelas">
                    ${renderEstrelas(av.nota)}
                </div>
            </article>
        `).join("");

        if (window.lucide) {
            window.lucide.createIcons();
        }

    } catch (erro) {
        console.error("Erro ao carregar avaliações:", erro);
        lista.innerHTML = `<p class="sem-avaliacoes">Erro ao carregar avaliações.</p>`;
    }
}

function renderEstrelas(nota) {
    return Array.from({ length: 5 }, (_, i) =>
        `<span class="estrela ${i < nota ? "ativa" : ""}" aria-hidden="true">★</span>`
    ).join("");
}
// #endregion

// #region Grid de produtos relacionados (mesma lógica da home, tamanho menor)
function renderRelacionados(lista, idAtual) {
    const container = document.getElementById("lista-relacionados");

    const relacionados = lista.filter(p => p.id !== idAtual);

    if (relacionados.length === 0) {
        container.style.display = "none";
        return;
    }

    const fragment = document.createDocumentFragment();

    relacionados.forEach(produto => {
        const card = criarCardRelacionado(produto);
        fragment.appendChild(card);
    });

    container.appendChild(fragment);

    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Navegação para outro produto ao clicar na setinha
    container.addEventListener("click", (event) => {
        const botao = event.target.closest(".btn-arrow");
        if (!botao) return;
        const article = botao.closest(".product-card");
        window.location.href = `produto.html?id=${article.dataset.id}`;
    });

    // Favorito nos cards relacionados
    container.addEventListener("click", (event) => {
        const botao = event.target.closest(".actions li:first-child button");
        if (!botao) return;
        const article = botao.closest(".product-card");
        botao.classList.toggle("is-favorite");
        toggleFavorito(article.dataset.id);
    });

    // Carrinho nos cards relacionados
    container.addEventListener("click", (event) => {
        const botao = event.target.closest(".actions li:last-child button");
        if (!botao) return;
        const article = botao.closest(".product-card");
        botao.classList.toggle("is-cart");
        toggleCarrinho(article.dataset.id);
    });
}

function criarCardRelacionado(produto) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.setAttribute("data-id", produto.id);

    const topo = document.createElement("header");
    topo.className = "product-top";

    if (produto.desconto > 0) {
        const badge = document.createElement("mark");
        badge.className = "badge discount-badge";
        badge.textContent = `${produto.desconto}% OFF`;
        topo.appendChild(badge);
    }

    const actions = document.createElement("menu");
    actions.className = "actions";
    actions.setAttribute("aria-label", "Ações do produto");

    const favLi = document.createElement("li");
    const btnFav = document.createElement("button");
    btnFav.type = "button";
    btnFav.className = `btn-icon${ehFavorito(produto.id) ? " is-favorite" : ""}`;
    btnFav.setAttribute("aria-label", "Adicionar aos favoritos");
    btnFav.innerHTML = `<i data-lucide="heart" aria-hidden="true"></i>`;
    favLi.appendChild(btnFav);

    const cartLi = document.createElement("li");
    const btnCart = document.createElement("button");
    btnCart.type = "button";
    btnCart.className = `btn-icon${estaNoCarrinho(produto.id) ? " is-cart" : ""}`;
    btnCart.setAttribute("aria-label", "Adicionar ao carrinho");
    btnCart.innerHTML = `<i data-lucide="shopping-cart" aria-hidden="true"></i>`;
    cartLi.appendChild(btnCart);

    actions.append(favLi, cartLi);
    topo.appendChild(actions);

    const imagem = document.createElement("img");
    imagem.src = produto.imagem;
    imagem.alt = `Foto do ${produto.nome}`;
    imagem.className = "product-image";

    const info = document.createElement("header");
    info.className = "product-info";

    const marca = document.createElement("span");
    marca.className = "brand";
    marca.textContent = produto.franquia;

    const titulo = document.createElement("h3");
    titulo.className = "title";
    titulo.textContent = produto.nome;

    const preco = document.createElement("p");
    preco.className = "price";
    preco.textContent = produto.preco.toLocaleString("pt-BR", {
        style: "currency", currency: "BRL"
    });

    const footer = document.createElement("footer");
    footer.className = "product-footer";

    const btnComprar = document.createElement("button");
    btnComprar.type = "button";
    btnComprar.className = "btn-buy";
    btnComprar.innerHTML = `<span>Comprar</span>`;

    const btnSeta = document.createElement("button");
    btnSeta.type = "button";
    btnSeta.className = "btn-arrow";
    btnSeta.setAttribute("aria-label", `Ver ${produto.nome}`);
    btnSeta.innerHTML = `<i data-lucide="chevron-right" aria-hidden="true"></i>`;

    footer.append(btnComprar, btnSeta);
    info.append(marca, titulo, preco, footer);
    card.append(topo, imagem, info);

    return card;
}
// #endregion