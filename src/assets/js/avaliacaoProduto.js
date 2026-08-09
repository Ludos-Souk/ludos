// #region Imports
import { verificarLogin } from "../../services/authService.js";
import { listarAvaliacoesProduto } from "../../services/avaliacaoService.js";
import { adicionarProduto, alterarQuantidade, estaNoCarrinho, quantidadeProduto, removerProduto, toggleCarrinho } from "../../services/carrinhoService.js";
import { ehFavorito, toggleFavorito } from "../../services/favoritosService.js";
import { buscarProdutoPorId, buscarProdutosAtivos } from "../../services/produtoService.js";
// #endregion

const searchForm = document.querySelector('.search-form');
const inputBusca = document.getElementById('search-input');
const btnMicrofone = document.querySelector('.mic-btn');

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const busca = inputBusca.value.trim();

    if (busca) {
        sessionStorage.setItem("href-pesquisa", busca);
        window.location.href = "home.html";
    }
});

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

/* Header navigation helpers: cart and filter fallback */
(function() {
    const btnCart = document.querySelector('button[aria-label="Ver meu carrinho"]');
    if (btnCart) btnCart.addEventListener('click', () => { window.location.href = 'carrinho.html'; });

    const btnFiltro = document.getElementById('btn-filter');
    if (btnFiltro) {
        btnFiltro.addEventListener('click', (e) => {
            if (!window.location.pathname.endsWith('home.html')) {
                sessionStorage.setItem('open-filter', 'true');
                window.location.href = 'home.html';
            }
        });
    }
})();

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
const header    = document.querySelector('.header');
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
        header?.classList.add("scrolled");
    } else {
        banner?.classList.remove("compact");
        header?.classList.remove("scrolled");
    }
});
// #endregion

// #region Botão voltar
btnVoltar.addEventListener('click', () => {
    window.history.back();
});
// #endregion

// #region Leitura do id na URL e carregamento do produto
const idProduto = sessionStorage.getItem("produtoId");

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

    const container =
        document.getElementById("produto-detalhe");

    container.innerHTML = "";

    const colunaImagem =
        criarColunaImagem(produto);

    const info =
        criarColunaInfo(produto);

    const colunaAvaliacoes =
        criarColunaAvaliacoes();

    container.append(
        colunaImagem,
        info.elemento,
        colunaAvaliacoes
    );

    if (window.lucide) {
        window.lucide.createIcons();
    }

    configurarQuantidade(
        info.btnMais,
        info.btnMenos,
        info.valorQuantidade,
        produto
    );

    configurarFavorito(
        info.btnFavorito,
        produto
    );

    configurarCarrinho(
        info.btnCarrinho,
        produto
    );

    configurarComprar(
        info.btnComprar,
        produto.id
    );

    await carregarAvaliacoes(
        produto.id
    );
}

function configurarComprar(btnComprar, produtoId) {

    btnComprar.addEventListener("click", () => {
        const quantidade = quantidadeProduto(produtoId);
        if (quantidade <= 0) {
            return;
        }
        const produtosSelecionados = [
            {
                id: produtoId,
                quantidade: quantidade
            }
        ];
        sessionStorage.setItem(
            "produtosSelecionados",
            JSON.stringify(produtosSelecionados)
        );
        window.location.href = "finalizarPedido.html";
    });
}

function criarColunaInfo(produto) {

    const coluna =
        document.createElement("div");

    coluna.className =
        "produto-col-info";

    const topo =
        criarTopoAcoes(produto);

    const preco =
        criarPreco(produto);

    const quantidade =
        criarControleQuantidade();

    const estoque =
        document.createElement("p");

    estoque.className =
        "produto-estoque";

    estoque.textContent =
        `Disponíveis: ${produto.estoque}`;

    const btnComprar =
        document.createElement("button");

    btnComprar.type =
        "button";

    btnComprar.className =
        "btn-comprar-detalhe";

    btnComprar.textContent =
        "Comprar";

    coluna.append(
        topo.elemento,
        preco.preco,
        preco.parcela,
        quantidade.elemento,
        estoque,
        btnComprar
    );

    return {
        elemento: coluna,
        btnFavorito:
            topo.btnFavorito,
        btnCarrinho:
            topo.btnCarrinho,
        btnMais:
            quantidade.btnMais,
        btnMenos:
            quantidade.btnMenos,
        valorQuantidade:
            quantidade.valor,
        btnComprar
    };

}

function criarTopoAcoes(produto) {

    const topo =
        document.createElement("div");

    topo.className =
        "produto-topo-acoes";

    if (produto.desconto > 0) {

        const badge =
            document.createElement("span");

        badge.className =
            "produto-badge-desconto";

        badge.textContent =
            `${produto.desconto}% OFF`;

        topo.append(badge);

    }

    const btnFavorito =
        document.createElement("button");

    btnFavorito.type =
        "button";

    btnFavorito.id =
        "btn-favorito-detalhe";

    btnFavorito.className =
        "btn-icon";

    if (ehFavorito(produto.id)) {
        btnFavorito.classList.add(
            "is-favorite"
        );
    }

    btnFavorito.innerHTML =
        `<i data-lucide="heart"></i>`;

    const btnCarrinho =
        document.createElement("button");

    btnCarrinho.type =
        "button";

    btnCarrinho.id =
        "btn-carrinho-detalhe";

    btnCarrinho.className =
        "btn-icon";

    if (estaNoCarrinho(produto.id)) {
        btnCarrinho.classList.add(
            "is-cart"
        );
    }

    btnCarrinho.innerHTML =
        `<i data-lucide="shopping-cart"></i>`;

    topo.append(
        btnFavorito,
        btnCarrinho
    );

    return {

        elemento: topo,
        btnFavorito,
        btnCarrinho

    };

}

function criarPreco(produto) {

    const preco =
        document.createElement("p");

    preco.className =
        "produto-preco-principal";

    preco.textContent =
        produto.preco.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    const parcela =
        document.createElement("p");

    parcela.className =
        "produto-preco-parcelado";

    parcela.textContent =
        `Ou 3x de ${(produto.preco / 3).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        )}`;

    return {

        preco,
        parcela

    };

}

function criarControleQuantidade() {

    const container =
        document.createElement("div");

    container.className =
        "produto-quantidade";

    const btnMenos =
        document.createElement("button");

    btnMenos.type =
        "button";

    btnMenos.className =
        "btn-qtd";

    btnMenos.innerHTML =
        `<i data-lucide="minus"></i>`;

    const valor =
        document.createElement("span");

    valor.className =
        "qtd-valor";

    const btnMais =
        document.createElement("button");

    btnMais.type =
        "button";

    btnMais.className =
        "btn-qtd";

    btnMais.innerHTML =
        `<i data-lucide="plus"></i>`;

    container.append(
        btnMenos,
        valor,
        btnMais
    );

    return {

        elemento: container,
        btnMais,
        btnMenos,
        valor

    };

}

function criarColunaAvaliacoes() {

    const coluna =
        document.createElement("div");

    coluna.className =
        "produto-col-avaliacoes";

    const titulo =
        document.createElement("h3");

    titulo.className =
        "avaliacoes-titulo";

    titulo.innerHTML =
        `<i data-lucide="message-circle"></i> Avaliações`;

    const lista =
        document.createElement("div");

    lista.className =
        "avaliacoes-lista";

    lista.id =
        "avaliacoes-lista";

    lista.innerHTML =
        `<p class="sem-avaliacoes">Carregando avaliações...</p>`;

    coluna.append(
        titulo,
        lista
    );

    return coluna;

}

function configurarQuantidade(
    btnMais,
    btnMenos,
    valor,
    produto
) {
    if (estaNoCarrinho(produto.id)) {
        valor.textContent = quantidadeProduto(produto.id);
    } else {
        valor.textContent = 0
    }


    btnMais.addEventListener(
        "click",
        () => {
            let quantidade = parseInt(valor.textContent);

            if ( quantidade < produto.estoque) {
                quantidade++;
                valor.textContent = quantidade;
            }

            if (!estaNoCarrinho(produto.id) && quantidade > 0) {
                adicionarProduto(produto.id, quantidade);
                document.getElementById("btn-carrinho-detalhe").classList.add("is-cart");
            } else {
                alterarQuantidade(produto.id, quantidade);
            }
        }
    );

    btnMenos.addEventListener(
        "click",
        () => {
            let quantidade = parseInt(valor.textContent);
            if (quantidade > 0) {
                quantidade--;
                valor.textContent = quantidade;
            }

            if (quantidade === 0) {
                if (estaNoCarrinho(produto.id)) {
                    removerProduto(produto.id);
                    document.getElementById("btn-carrinho-detalhe").classList.remove("is-cart");
                }
            }

            alterarQuantidade(produto.id, quantidade);
        }
    );
}

function criarColunaImagem(produto) {

    const coluna =
        document.createElement("div");

    coluna.className =
        "produto-col-imagem";

    const imagem =
        document.createElement("img");

    imagem.src =
        produto.imagem;

    imagem.alt =
        `Foto de ${produto.nome}`;

    imagem.className =
        "produto-imagem-principal";

    const nome =
        document.createElement("h3");

    nome.className =
        "produto-nome-detalhe";

    nome.textContent =
        produto.nome;

    coluna.append(
        imagem,
        nome
    );

    return coluna;

}

function configurarFavorito(botaoFavorito, produto) {
    botaoFavorito.addEventListener("click", (e) => {
        e.currentTarget.classList.toggle("is-favorite");
        toggleFavorito(produto.id);
    });
}

function configurarCarrinho(botaoCarrinho, produto) {
    botaoCarrinho.addEventListener("click", (e) => {
        e.currentTarget.classList.toggle("is-cart");
        toggleCarrinho(produto.id);

        if (estaNoCarrinho(produto.id) && document.querySelector(".qtd-valor").textContent == 0 ) {
            document.querySelector(".qtd-valor").textContent = 1;
        } else {
            document.querySelector(".qtd-valor").textContent = 0;
        }

        alterarQuantidade(produto.id, parseInt(document.querySelector(".qtd-valor").textContent));
    });
}
// #endregion

// #region Avaliações
async function carregarAvaliacoes(idProduto) {
    const lista = document.getElementById("avaliacoes-lista");

    try {
        const avaliacoes = await listarAvaliacoesProduto(idProduto);

        if (!avaliacoes || avaliacoes.length === 0) {
            lista.innerHTML = `<p class="sem-avaliacoes">Nenhuma avaliação encontrada.</p>`;
            return;
        }

        lista.innerHTML = "";

        for (const avaliacao of avaliacoes) {

            const card =
                await criarCardAvaliacao(
                    avaliacao
                );

            lista.append(card);

        }

        if (window.lucide) {
            window.lucide.createIcons();
        }

    } catch (erro) {
        console.error("Erro ao carregar avaliações:", erro);
        lista.innerHTML = `<p class="sem-avaliacoes">Erro ao carregar avaliações.</p>`;
    }
}

async function criarCardAvaliacao(avaliacao) {

    const artigo =
        document.createElement("article");

    artigo.className =
        "avaliacao-card";

    const autor =
        document.createElement("div");

    autor.className =
        "avaliacao-autor";

    const icone =
        document.createElement("i");

    icone.setAttribute(
        "data-lucide",
        "circle-user"
    );

    autor.append(icone);

    autor.append(
        await avaliacao.getNomeUsuario()
    );

    const comentario =
        document.createElement("p");

    comentario.className =
        "avaliacao-texto";

    comentario.textContent =
        avaliacao.comentario ?? "";

    const estrelas =
        document.createElement("div");

    estrelas.className =
        "avaliacao-estrelas";

    estrelas.setAttribute(
        "aria-label",
        `${avaliacao.nota} de 5 estrelas`
    );

    estrelas.innerHTML =
        renderEstrelas(
            avaliacao.nota
        );

    artigo.append(
        autor,
        comentario,
        estrelas
    );

    return artigo;

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
        sessionStorage.setItem("produtoId", article.dataset.id);
        window.location.href = `avaliacaoProduto.html`;
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