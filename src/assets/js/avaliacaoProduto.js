import { ROTAS } from "../../config/rotas.js";
// #region Imports
import { listarAvaliacoesProduto } from "../../services/avaliacaoService.js";
import { adicionarProduto, alterarQuantidade, estaNoCarrinho, quantidadeProduto, removerProduto, toggleCarrinho } from "../../services/carrinhoService.js";
import { ehFavorito, toggleFavorito } from "../../services/favoritosService.js";
import { buscarProdutoPorId, buscarProdutosAtivos } from "../../services/produtoService.js";
import { configurarPromocaoPrimeiraCompra } from "./utils/promocaoPrimeiraCompra.js";
// #endregion

// #region Utilitários de UI
function criarIcone(dataLucide) {
    const icone = document.createElement("i");
    icone.setAttribute("data-lucide", dataLucide);
    icone.setAttribute("aria-hidden", "true");
    return icone;
}

function criarMensagemEstado(texto, classe = "sem-avaliacoes") {
    const mensagem = document.createElement("p");
    mensagem.className = classe;
    mensagem.textContent = texto;
    return mensagem;
}
// #endregion

const inputBusca = document.getElementById('search-input');

configurarPesquisaCabecalho({
    input: inputBusca,
    aoPesquisar: (busca) => {
        if (!busca) return;
        sessionStorage.setItem("href-pesquisa", busca);
        window.location.href = ROTAS.HOME;
    }
});

/* Header navigation helpers: cart and filter fallback */
(function() {
    const btnCart = document.querySelector('button[aria-label="Ver meu carrinho"]');
    if (btnCart) btnCart.addEventListener('click', () => { window.location.href = ROTAS.CARRINHO; });

    const btnFiltro = document.getElementById('btn-filter');
    if (btnFiltro) {
        btnFiltro.addEventListener('click', (e) => {
            if (!window.location.pathname.endsWith(ROTAS.HOME)) {
                sessionStorage.setItem('open-filter', 'true');
                window.location.href = ROTAS.HOME;
            }
        });
    }
})();

// #region Verificação de acesso
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
bannerFechado = !(await configurarPromocaoPrimeiraCompra({
    banner,
    header,
    conteudo: document.querySelector(".main-content")
}));
// #endregion

// #region Botão voltar
btnVoltar.addEventListener('click', () => {
    window.history.back();
});
// #endregion

// #region Leitura do id na URL e carregamento do produto
const idProduto = sessionStorage.getItem("produtoId");

if (!idProduto) {
    window.location.href = ROTAS.HOME;
}

try {
    const [produto, todosProdutos] = await Promise.all([
        buscarProdutoPorId(idProduto),
        buscarProdutosAtivos()
    ]);

    if (!produto) {
        const container = document.getElementById("produto-detalhe");
        container?.replaceChildren(criarMensagemEstado("Produto não encontrado."));
    } else {
        await renderProduto(produto);
        renderRelacionados(todosProdutos, idProduto);
    }
} catch (erro) {
    console.error("Não foi possível carregar o produto:", erro);
    const container = document.getElementById("produto-detalhe");
    container?.replaceChildren(criarMensagemEstado("Não foi possível carregar este produto. Tente novamente."));
    mostrarFeedbackGlobal("Não foi possível carregar os dados do produto.", "error");
}
// #endregion

// #region Render do produto
async function renderProduto(produto) {

    const container =
        document.getElementById("produto-detalhe");

    container.replaceChildren();

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
        window.location.href = ROTAS.FINALIZAR_PEDIDO;
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

    btnFavorito.appendChild(criarIcone("heart"));

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

    btnCarrinho.appendChild(criarIcone("shopping-cart"));

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

    btnMenos.appendChild(criarIcone("minus"));

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

    btnMais.appendChild(criarIcone("plus"));

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

    titulo.appendChild(criarIcone("message-circle"));
    titulo.appendChild(document.createTextNode(" Avaliações"));

    const lista =
        document.createElement("div");

    lista.className =
        "avaliacoes-lista";

    lista.id =
        "avaliacoes-lista";

    lista.replaceChildren(criarMensagemEstado("Carregando avaliações..."));

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
    lista.setAttribute("aria-busy", "true");
    lista.replaceChildren(criarMensagemEstado("Carregando avaliações..."));

    try {
        const avaliacoes = await listarAvaliacoesProduto(idProduto);

        if (!avaliacoes || avaliacoes.length === 0) {
            lista.replaceChildren(criarMensagemEstado("Nenhuma avaliação encontrada."));
            return;
        }

        const cards = await Promise.all(avaliacoes.map(criarCardAvaliacao));
        lista.replaceChildren(...cards);

        if (window.lucide) {
            window.lucide.createIcons();
        }

    } catch (erro) {
        console.error("Erro ao carregar avaliações:", erro);
        lista.replaceChildren(criarMensagemEstado("Erro ao carregar avaliações."));
        mostrarFeedbackGlobal("Não foi possível carregar as avaliações deste produto.", "error");
    } finally {
        lista.setAttribute("aria-busy", "false");
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

    estrelas.replaceChildren(...renderEstrelas(avaliacao.nota));

    artigo.append(
        autor,
        comentario,
        estrelas
    );

    return artigo;

}

function renderEstrelas(nota) {
    return Array.from({ length: 5 }, (_, i) => {
        const estrela = document.createElement("span");
        estrela.className = `estrela ${i < nota ? "ativa" : ""}`;
        estrela.setAttribute("aria-hidden", "true");
        estrela.textContent = "★";
        return estrela;
    });
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
        window.location.href = ROTAS.AVALIACAO_PRODUTO;
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
    btnFav.appendChild(criarIcone("heart"));
    favLi.appendChild(btnFav);

    const cartLi = document.createElement("li");
    const btnCart = document.createElement("button");
    btnCart.type = "button";
    btnCart.className = `btn-icon${estaNoCarrinho(produto.id) ? " is-cart" : ""}`;
    btnCart.setAttribute("aria-label", "Adicionar ao carrinho");
    btnCart.appendChild(criarIcone("shopping-cart"));
    cartLi.appendChild(btnCart);

    actions.append(favLi, cartLi);
    topo.appendChild(actions);

    const imagem = document.createElement("img");
    imagem.src = produto.imagem;
    imagem.alt = `Foto do ${produto.nome}`;
    imagem.className = "product-image";

    const areaImagem = document.createElement("div");
    areaImagem.className = "product-image-gradient";
    areaImagem.appendChild(imagem);

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
    const textoComprar = document.createElement("span");
    textoComprar.textContent = "Comprar";
    btnComprar.appendChild(textoComprar);

    const btnSeta = document.createElement("button");
    btnSeta.type = "button";
    btnSeta.className = "btn-arrow";
    btnSeta.setAttribute("aria-label", `Ver ${produto.nome}`);
    btnSeta.appendChild(criarIcone("chevron-right"));

    footer.append(btnComprar, btnSeta);
    info.append(marca, titulo, preco, footer);
    card.append(topo, areaImagem, info);

    return card;
}

// #endregion
