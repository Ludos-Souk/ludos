// Responsabilidade do arquivo: Monta os detalhes do produto, quantidade, carrinho, favoritos, avaliações e relacionados.

import { ROTAS } from "../../config/rotas.js";
// #region Imports
import { listarAvaliacoesProduto } from "../../services/avaliacaoService.js";
import { adicionarProduto, alterarQuantidade, estaNoCarrinho, quantidadeProduto, removerProduto, toggleCarrinho } from "../../services/carrinhoService.js";
import { ehFavorito, toggleFavorito } from "../../services/favoritosService.js";
import { buscarProdutoPorId, buscarProdutosAtivos } from "../../services/produtoService.js";
import { configurarPromocaoPrimeiraCompra } from "./utils/promocaoPrimeiraCompra.js";
import { configurarPesquisaCabecalho } from "./utils/ui.js";
import { mostrarFeedbackGlobal } from "./utils/asyncFeedback.js";
// #endregion

// #region Utilitários de UI
/** Cria um marcador que o Lucide transformará no ícone solicitado. */
function criarIcone(dataLucide) {
    const icone = document.createElement("i");
    icone.setAttribute("data-lucide", dataLucide);
    icone.setAttribute("aria-hidden", "true");
    return icone;
}

/** Cria o parágrafo usado para comunicar carregamento, erro ou ausência de dados. */
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
    // Escuta o evento "click" em if (btnCart) btnCart e executa o tratamento abaixo.
    if (btnCart) btnCart.addEventListener('click', () => { window.location.href = ROTAS.CARRINHO; });

    const btnPerfil = document.querySelector('button[aria-label="Acessar meu perfil"]');
    // Escuta o evento "click" em if (btnPerfil) btnPerfil e executa o tratamento abaixo.
    if (btnPerfil) btnPerfil.addEventListener('click', () => { window.location.href = ROTAS.PERFIL; });

    const btnFavoritos = document.querySelector('button[aria-label="Ver meus favoritos"]');
    if (btnFavoritos) {
        // Escuta o evento "click" em btnFavoritos e executa o tratamento abaixo.
        btnFavoritos.addEventListener('click', () => {
            window.location.href = `${ROTAS.PERFIL}?abrir=favoritos`;
        });
    }

    const btnFiltro = document.getElementById('btn-filter');
    if (btnFiltro) {
        // Escuta o evento "click" em btnFiltro e executa o tratamento abaixo.
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
/** Exibe ou oculta o banner promocional conforme o estado atual. */
function alternarBanner() {
    bannerFechado = true;
    banner.classList.add("oculto");
    document.querySelector('.header').classList.add('sem-banner');
    document.querySelector('.main-content').style.marginTop = "160px";
}
window.alternarBanner = alternarBanner;

// Escuta o evento "scroll" em window e executa o tratamento abaixo.
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
/** Reconstrói a área principal com dados, imagem, preço, estoque e avaliações. */
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

/** Faz o botão de compra adicionar o produto atual ao carrinho. */
function configurarComprar(btnComprar, produtoId) {

    // Escuta o evento "click" em btnComprar e executa o tratamento abaixo.
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

/** Monta a coluna com franquia, nome, descrição, preço e ações do produto. */
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

/** Monta os botões de favoritar e adicionar ao carrinho no topo do produto. */
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

    btnFavorito.setAttribute("aria-label", "Adicionar aos favoritos");
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

    btnCarrinho.setAttribute("aria-label", "Adicionar ao carrinho");
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

/** Monta a área de preço normal ou promocional do produto. */
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

/** Monta o seletor de quantidade respeitando estoque e quantidade no carrinho. */
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

    btnMenos.setAttribute("aria-label", "Diminuir quantidade");

    btnMenos.appendChild(criarIcone("minus"));

    const valor =
        document.createElement("span");

    valor.className =
        "qtd-valor";

    valor.setAttribute("aria-live", "polite");

    const btnMais =
        document.createElement("button");

    btnMais.type =
        "button";

    btnMais.className =
        "btn-qtd";

    btnMais.setAttribute("aria-label", "Aumentar quantidade");

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

/** Monta a coluna que receberá a média e a lista de avaliações do produto. */
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

/** Sincroniza os botões de quantidade com estoque, interface e carrinho persistido. */
function configurarQuantidade(
    btnMais,
    btnMenos,
    valor,
    produto
) {
    const atualizarControle = (quantidade) => {
        valor.textContent = quantidade;
        valor.setAttribute("aria-label", `Quantidade: ${quantidade}`);
        btnMenos.disabled = quantidade <= 0;
        btnMais.disabled = quantidade >= produto.estoque;
    };

    // Começa com a quantidade já armazenada ou zero para um produto novo.
    if (estaNoCarrinho(produto.id)) {
        atualizarControle(quantidadeProduto(produto.id));
    } else {
        atualizarControle(0);
    }


    // Aumenta a quantidade escolhida quando o usuário aciona o botão de mais.
    btnMais.addEventListener(
        "click",
        () => {
            let quantidade = parseInt(valor.textContent);

            // Impede que a quantidade ultrapasse o estoque atual.
            if ( quantidade < produto.estoque) {
                quantidade++;
                atualizarControle(quantidade);
            }

            // Cria a entrada na primeira unidade e depois apenas atualiza sua quantidade.
            if (!estaNoCarrinho(produto.id) && quantidade > 0) {
                adicionarProduto(produto.id, quantidade);
                document.getElementById("btn-carrinho-detalhe").classList.add("is-cart");
            } else {
                alterarQuantidade(produto.id, quantidade);
            }
        }
    );

    // Diminui a quantidade escolhida quando o usuário aciona o botão de menos.
    btnMenos.addEventListener(
        "click",
        () => {
            let quantidade = parseInt(valor.textContent);
            if (quantidade > 0) {
                quantidade--;
                atualizarControle(quantidade);
            }

            // Zero remove completamente o item e também o estado visual do botão.
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

/** Monta a coluna visual com a imagem principal do produto. */
function criarColunaImagem(produto) {

    const coluna =
        document.createElement("div");

    coluna.className =
        "produto-col-imagem";

    const molduraImagem =
        document.createElement("div");

    molduraImagem.className =
        "produto-imagem-moldura product-image-fade";

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

    molduraImagem.append(imagem);

    coluna.append(
        molduraImagem,
        nome
    );

    return coluna;

}

/** Alterna o produto nos favoritos e atualiza o estado visual do botão. */
function configurarFavorito(botaoFavorito, produto) {
    // Escuta o evento "click" em botaoFavorito e executa o tratamento abaixo.
    botaoFavorito.addEventListener("click", (e) => {
        e.currentTarget.classList.toggle("is-favorite");
        toggleFavorito(produto.id);
    });
}

/** Alterna a presença no carrinho e mantém o contador da página coerente. */
function configurarCarrinho(botaoCarrinho, produto) {
    // Escuta o evento "click" em botaoCarrinho e executa o tratamento abaixo.
    botaoCarrinho.addEventListener("click", (e) => {
        e.currentTarget.classList.toggle("is-cart");
        toggleCarrinho(produto.id);

        const valor = document.querySelector(".qtd-valor");
        const quantidade = estaNoCarrinho(produto.id) && Number(valor.textContent) === 0 ? 1 : 0;
        const [btnMenos, btnMais] = document.querySelectorAll(".produto-quantidade .btn-qtd");

        valor.textContent = quantidade;
        valor.setAttribute("aria-label", `Quantidade: ${quantidade}`);
        btnMenos.disabled = quantidade <= 0;
        btnMais.disabled = quantidade >= produto.estoque;
        alterarQuantidade(produto.id, quantidade);
    });
}
// #endregion

// #region Avaliações
/** Busca avaliações do produto e atualiza média, distribuição e comentários. */
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

/** Monta nome do autor, nota, data e comentário de uma avaliação. */
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

/** Converte uma nota numérica em cinco estrelas preenchidas ou vazias. */
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
/** Renderiza produtos da mesma franquia, excluindo o item atualmente aberto. */
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

/** Monta um card navegável de produto relacionado. */
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
