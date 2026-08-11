import { ROTAS } from "../../config/rotas.js";
import {
    aguardarUsuario,
    logout
} from "../../services/authService.js";
import {
    atualizarFotoPerfil,
    buscarUsuarioPorId,
    listarEnderecos
} from "../../services/usuarioService.js";
import { uploadImagem } from "../../services/cloudinaryService.js";
import { listarFavoritos, removerFavorito } from "../../services/favoritosService.js";
import { buscarProdutoPorId } from "../../services/produtoService.js";
import { listarPedidosUsuario } from "../../services/pedidoService.js";
import { listarAvaliacoesUsuario } from "../../services/avaliacaoService.js";
import {
    aplicarConfiguracoesAcessibilidade,
    obterConfiguracoesAcessibilidade,
    obterConfiguracao,
    salvarConfiguracao,
    salvarConfiguracoesAcessibilidade
} from "../../services/configuracoesService.js";
import { mostrarFeedbackGlobal, salvarFeedbackNavegacao } from "./utils/asyncFeedback.js";
import { configurarPesquisaCabecalho, substituirPorEstado } from "./utils/ui.js";

const body = document.body;
const header = document.querySelector(".header");
const nome = document.getElementById("profile-name");
const email = document.getElementById("profile-email");
const botaoSair = document.getElementById("logout-button");
const controleFonte = document.getElementById("font-size");
const previaFonte = document.getElementById("font-preview");
const avatar = document.getElementById("profile-avatar");
const avatarPlaceholder = document.getElementById("avatar-placeholder");
const inputFoto = document.getElementById("profile-photo-input");
const botaoEditarAvatar = document.getElementById("edit-avatar-button");
const feedbackFoto = document.getElementById("photo-feedback");
const botaoFiltro = document.getElementById("profile-filter-button");
const botaoAbrirEnderecos = document.getElementById("open-address-modal");
const modalEndereco = document.getElementById("modal-endereco");
const corpoModalEndereco = document.getElementById("address-modal-body");
const botaoFecharModal = document.getElementById("btn-fechar-modal");
const botaoConfirmarEndereco = document.getElementById("confirm-address");
const botaoAdicionarEndereco = document.getElementById("add-address");
const botaoAbrirFavoritos = document.getElementById("open-favorites-modal");
const botaoAbrirPedidos = document.getElementById("open-orders-modal");
const botaoAbrirCartoes = document.getElementById("open-cards-modal");
const modalCartoes = document.getElementById("cards-modal");
const modalFavoritos = document.getElementById("favorites-modal");
const modalPedidos = document.getElementById("orders-modal");
const corpoModalFavoritos = document.getElementById("favorites-modal-body");
const corpoModalPedidos = document.getElementById("orders-modal-body");
const botaoAbrirAvaliacoes = document.getElementById("open-reviews-modal");
const modalAvaliacoes = document.getElementById("reviews-modal");
const corpoModalAvaliacoes = document.getElementById("reviews-modal-body");
const modalRecorteFoto = document.getElementById("photo-crop-dialog");
const canvasRecorteFoto = document.getElementById("photo-crop-canvas");
const areaRecorteFoto = document.querySelector(".photo-crop-stage");
const controleZoomFoto = document.getElementById("photo-zoom");
const botaoSalvarRecorte = document.getElementById("save-photo-crop");
const botaoCancelarRecorte = document.getElementById("cancel-photo-crop");
const botaoFecharRecorte = document.getElementById("close-photo-crop");
let usuarioAtual = null;
let enderecoSelecionado = null;
let acionadorDialogoPerfil = null;
let urlTemporariaFoto = null;
let imagemRecorte = null;
let zoomFoto = 1;
let deslocamentoFotoX = 0;
let deslocamentoFotoY = 0;
let ultimoPontoArraste = null;

function atualizarIcones() {
    window.lucide?.createIcons();
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

function criarIcone(nome) {
    const icone = document.createElement("i");
    icone.dataset.lucide = nome;
    icone.setAttribute("aria-hidden", "true");
    return icone;
}

function exibirEstadoDialogo(container, mensagem, icone = "inbox") {
    const estado = criarElemento("section", "profile-dialog-empty");
    estado.append(criarIcone(icone), criarElemento("p", "", mensagem));
    container.replaceChildren(estado);
    container.setAttribute("aria-busy", "false");
    atualizarIcones();
}

function abrirProduto(produtoId) {
    sessionStorage.setItem("produtoId", produtoId);
    window.location.href = ROTAS.AVALIACAO_PRODUTO;
}

function criarCardFavorito(produto) {
    const card = criarElemento("article", "profile-favorite-card");
    const imagemContainer = criarElemento("div", "profile-favorite-image product-image-fade");

    if (produto.imagem) {
        const imagem = document.createElement("img");
        imagem.src = produto.imagem;
        imagem.alt = `Imagem de ${produto.nome}`;
        imagem.addEventListener("error", () => imagemContainer.replaceChildren(criarIcone("image")));
        imagemContainer.append(imagem);
    } else {
        imagemContainer.append(criarIcone("image"));
    }

    const informacoes = criarElemento("div", "profile-favorite-info");
    informacoes.append(
        criarElemento("span", "profile-item-eyebrow", produto.franquia || "Produto"),
        criarElemento("h3", "", produto.nome),
        criarElemento("strong", "profile-item-price", Number(produto.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
    );

    const acoes = criarElemento("div", "profile-item-actions");
    const visualizar = criarElemento("button", "profile-primary-action", "Ver produto");
    visualizar.type = "button";
    visualizar.addEventListener("click", () => abrirProduto(produto.id));
    const remover = criarElemento("button", "profile-icon-action");
    remover.type = "button";
    remover.setAttribute("aria-label", `Remover ${produto.nome} dos favoritos`);
    remover.append(criarIcone("heart-off"));
    remover.addEventListener("click", () => {
        removerFavorito(produto.id);
        card.remove();
        if (!corpoModalFavoritos.querySelector(".profile-favorite-card")) {
            exibirEstadoDialogo(corpoModalFavoritos, "Você ainda não possui produtos favoritos.", "heart");
        }
    });
    acoes.append(visualizar, remover);
    card.append(imagemContainer, informacoes, acoes);
    return card;
}

async function abrirModalFavoritos(event) {
    acionadorDialogoPerfil = event?.currentTarget || botaoAbrirFavoritos;
    corpoModalFavoritos.setAttribute("aria-busy", "true");
    corpoModalFavoritos.replaceChildren(criarElemento("p", "profile-dialog-state", "Carregando favoritos..."));
    modalFavoritos.showModal();
    body.classList.add("modal-open");
    modalFavoritos.querySelector(".profile-dialog-close")?.focus();

    try {
        const ids = [...new Set(listarFavoritos())];
        if (!ids.length) return exibirEstadoDialogo(corpoModalFavoritos, "Você ainda não possui produtos favoritos.", "heart");
        const produtos = (await Promise.all(ids.map(buscarProdutoPorId))).filter(Boolean);
        if (!produtos.length) return exibirEstadoDialogo(corpoModalFavoritos, "Os produtos favoritos não estão mais disponíveis.", "heart-off");
        const grade = criarElemento("div", "profile-favorites-grid");
        produtos.forEach(produto => grade.append(criarCardFavorito(produto)));
        corpoModalFavoritos.replaceChildren(grade);
        atualizarIcones();
    } catch (erro) {
        console.error("Não foi possível carregar os favoritos:", erro);
        exibirEstadoDialogo(corpoModalFavoritos, "Não foi possível carregar seus favoritos.", "circle-alert");
    } finally {
        corpoModalFavoritos.setAttribute("aria-busy", "false");
    }
}

function converterData(valor) {
    if (valor?.toDate) return valor.toDate();
    const data = new Date(valor ?? 0);
    return Number.isNaN(data.getTime()) ? new Date(0) : data;
}

function obterStatusPedido(pedido) {
    const status = String(pedido.status || "Pendente");
    const normalizado = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (normalizado.includes("cancel")) return { texto: "Cancelado", classe: "cancelled" };
    if (["entregue", "retirado", "concluido", "finalizado"].some(item => normalizado.includes(item))) return { texto: pedido.formaEntrega?.includes("Retirar") ? "Retirado" : "Entregue", classe: "completed" };
    if (["enviado", "transporte"].some(item => normalizado.includes(item))) return { texto: "Em transporte", classe: "shipping" };
    if (["pronto", "disponivel"].some(item => normalizado.includes(item))) return { texto: "Pronto para retirada", classe: "shipping" };
    if (["prepar", "separ"].some(item => normalizado.includes(item))) return { texto: "Em preparação", classe: "preparing" };
    return { texto: status, classe: "pending" };
}

async function carregarItensPedido(pedido, cacheProdutos) {
    const itens = Array.isArray(pedido.produtos) ? pedido.produtos : [];
    const produtos = await Promise.all(itens.map(async item => {
        const id = item?.produtoId ?? item?.id;
        if (!id) return null;
        if (!cacheProdutos.has(id)) cacheProdutos.set(id, buscarProdutoPorId(id));
        const produto = await cacheProdutos.get(id);
        return { id, produto, quantidade: Number(item.quantidade) || 1 };
    }));
    return produtos.filter(Boolean);
}

function criarCardPedido(pedido, itens) {
    const card = criarElemento("article", "profile-order-card");
    const cabecalho = criarElemento("header", "profile-order-header");
    const identificacao = criarElemento("div", "");
    identificacao.append(
        criarElemento("span", "profile-item-eyebrow", `Pedido #${String(pedido.id || "------").slice(-6).toUpperCase()}`),
        criarElemento("h3", "", converterData(pedido.criadoEm).toLocaleDateString("pt-BR"))
    );
    const statusPedido = obterStatusPedido(pedido);
    cabecalho.append(identificacao, criarElemento("span", `profile-order-status ${statusPedido.classe}`, statusPedido.texto));

    const lista = criarElemento("ul", "profile-order-products");
    itens.forEach(item => {
        const produto = item.produto;
        const linha = criarElemento("li", "profile-order-product");
        const imagem = criarElemento("span", "profile-order-product-image product-image-fade");
        if (produto?.imagem) {
            const img = document.createElement("img");
            img.src = produto.imagem;
            img.alt = "";
            imagem.append(img);
        } else imagem.append(criarIcone("package"));
        linha.append(imagem, criarElemento("span", "", produto?.nome || "Produto indisponível"), criarElemento("strong", "", `${item.quantidade}x`));
        lista.append(linha);
    });

    const rodape = criarElemento("footer", "profile-order-footer");
    const entrega = String(pedido.formaEntrega || "Receber").toLowerCase().includes("retir") ? "Retirada na loja" : "Entrega";
    const formatarMoeda = valor => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const subtotal = Math.max(0, Number(pedido.preco) || 0);
    const desconto = Math.max(0, Number(pedido.desconto) || 0);
    const total = Math.max(0, subtotal - desconto);
    const resumo = criarElemento("dl", "profile-order-summary");

    [
        ["Subtotal", formatarMoeda(subtotal), ""],
        ["Desconto", `- ${formatarMoeda(desconto)}`, "discount"],
        ["Total", formatarMoeda(total), "total"]
    ].forEach(([rotulo, valor, classe]) => {
        const linha = criarElemento("div", classe);
        linha.append(criarElemento("dt", "", rotulo), criarElemento("dd", "", valor));
        resumo.append(linha);
    });

    rodape.append(criarElemento("span", "profile-order-delivery", entrega), resumo);
    card.append(cabecalho, lista, rodape);
    return card;
}

async function abrirModalPedidos(event) {
    if (!usuarioAtual) return;
    acionadorDialogoPerfil = event.currentTarget;
    corpoModalPedidos.setAttribute("aria-busy", "true");
    corpoModalPedidos.replaceChildren(criarElemento("p", "profile-dialog-state", "Carregando pedidos..."));
    modalPedidos.showModal();
    body.classList.add("modal-open");
    modalPedidos.querySelector(".profile-dialog-close")?.focus();

    try {
        const pedidos = await listarPedidosUsuario(usuarioAtual.uid);
        pedidos.sort((a, b) => converterData(b.criadoEm) - converterData(a.criadoEm));
        if (!pedidos.length) return exibirEstadoDialogo(corpoModalPedidos, "Você ainda não realizou nenhum pedido.", "package-open");
        const cacheProdutos = new Map();
        const itensDosPedidos = await Promise.all(
            pedidos.map(pedido => carregarItensPedido(pedido, cacheProdutos))
        );
        const lista = criarElemento("div", "profile-orders-list");
        pedidos.forEach((pedido, indice) => {
            lista.append(criarCardPedido(pedido, itensDosPedidos[indice]));
        });
        corpoModalPedidos.replaceChildren(lista);
        atualizarIcones();
    } catch (erro) {
        console.error("Não foi possível carregar os pedidos:", erro);
        exibirEstadoDialogo(corpoModalPedidos, "Não foi possível carregar seus pedidos.", "circle-alert");
    } finally {
        corpoModalPedidos.setAttribute("aria-busy", "false");
    }
}

function criarEstrelasAvaliacao(nota) {
    const estrelas = criarElemento("span", "profile-review-stars");
    const notaValida = Math.max(0, Math.min(5, Number(nota) || 0));
    estrelas.setAttribute("role", "img");
    estrelas.setAttribute("aria-label", `Nota ${notaValida} de 5 estrelas`);
    for (let indice = 1; indice <= 5; indice += 1) {
        const estrela = criarElemento("span", indice <= notaValida ? "active" : "", "★");
        estrela.setAttribute("aria-hidden", "true");
        estrelas.append(estrela);
    }
    return estrelas;
}

function criarCardAvaliacao(avaliacao, produto) {
    const card = criarElemento("article", "profile-review-card");
    const cabecalho = criarElemento("header", "profile-review-header");
    const imagem = criarElemento("span", "profile-review-image product-image-fade");
    if (produto?.imagem) {
        const img = document.createElement("img");
        img.src = produto.imagem;
        img.alt = "";
        img.addEventListener("error", () => {
            imagem.replaceChildren(criarIcone("image"));
            atualizarIcones();
        });
        imagem.append(img);
    } else {
        imagem.append(criarIcone("image"));
    }
    const identificacao = criarElemento("div", "profile-review-product");
    identificacao.append(
        criarElemento("span", "profile-item-eyebrow", produto?.franquia || "Produto"),
        criarElemento("h3", "", produto?.nome || "Produto indisponível")
    );
    cabecalho.append(imagem, identificacao, criarEstrelasAvaliacao(avaliacao.nota));

    const comentario = criarElemento(
        "blockquote",
        `profile-review-comment${avaliacao.comentario ? "" : " empty"}`,
        avaliacao.comentario || "Nenhum comentário foi adicionado."
    );
    const rodape = criarElemento("footer", "profile-review-footer");
    const data = converterData(avaliacao.criadoEm);
    rodape.append(criarElemento("time", "", data.getTime() > 0 ? data.toLocaleDateString("pt-BR") : "Data não informada"));
    if (data.getTime() > 0) rodape.querySelector("time").dateTime = data.toISOString();
    if (produto) {
        const visualizar = criarElemento("button", "", "Ver produto");
        visualizar.type = "button";
        visualizar.addEventListener("click", () => abrirProduto(produto.id));
        rodape.append(visualizar);
    }
    card.append(cabecalho, comentario, rodape);
    return card;
}

async function abrirModalAvaliacoes(event) {
    if (!usuarioAtual) return;
    acionadorDialogoPerfil = event.currentTarget;
    corpoModalAvaliacoes.setAttribute("aria-busy", "true");
    corpoModalAvaliacoes.replaceChildren(criarElemento("p", "profile-dialog-state", "Carregando avaliações..."));
    modalAvaliacoes.showModal();
    body.classList.add("modal-open");
    modalAvaliacoes.querySelector(".profile-dialog-close")?.focus();

    try {
        const avaliacoes = await listarAvaliacoesUsuario(usuarioAtual.uid);
        avaliacoes.sort((a, b) => converterData(b.criadoEm) - converterData(a.criadoEm));
        if (!avaliacoes.length) return exibirEstadoDialogo(corpoModalAvaliacoes, "Você ainda não avaliou nenhum produto.", "message-circle-star");
        const cacheProdutos = new Map();
        avaliacoes.forEach((avaliacao) => {
            if (avaliacao.produtoId && !cacheProdutos.has(avaliacao.produtoId)) {
                cacheProdutos.set(avaliacao.produtoId, buscarProdutoPorId(avaliacao.produtoId));
            }
        });
        const produtos = await Promise.all(
            avaliacoes.map(avaliacao => avaliacao.produtoId
                ? cacheProdutos.get(avaliacao.produtoId)
                : null)
        );
        const lista = criarElemento("div", "profile-reviews-list");
        avaliacoes.forEach((avaliacao, indice) => {
            lista.append(criarCardAvaliacao(avaliacao, produtos[indice]));
        });
        corpoModalAvaliacoes.replaceChildren(lista);
        atualizarIcones();
    } catch (erro) {
        console.error("Não foi possível carregar as avaliações:", erro);
        exibirEstadoDialogo(corpoModalAvaliacoes, "Não foi possível carregar suas avaliações.", "circle-alert");
    } finally {
        corpoModalAvaliacoes.setAttribute("aria-busy", "false");
    }
}

function fecharDialogoPerfil(dialogo) {
    dialogo?.close();
    body.classList.remove("modal-open");
    acionadorDialogoPerfil?.focus();
    acionadorDialogoPerfil = null;
}

function atualizarHeaderNoScroll() {
    header?.classList.toggle("scrolled", window.scrollY > 30);
}

function exibirDadosUsuario(usuarioFirebase, usuarioBanco) {
    const nomeUsuario =
        usuarioBanco?.nome ||
        usuarioFirebase.displayName ||
        "Usuário";

    const emailUsuario =
        usuarioBanco?.email ||
        usuarioFirebase.email ||
        "E-mail não informado";

    nome.textContent = nomeUsuario;
    nome.title = nomeUsuario;
    email.textContent = emailUsuario;
    email.title = emailUsuario;
    exibirFotoPerfil(usuarioBanco?.imagemUrl || usuarioFirebase.photoURL);
}

function exibirFotoPerfil(imagemUrl) {
    if (!imagemUrl) {
        avatar.hidden = true;
        avatar.removeAttribute("src");
        avatar.alt = "";
        avatarPlaceholder.hidden = false;
        return;
    }

    avatar.src = imagemUrl;
    avatar.alt = `Foto de perfil de ${nome.textContent}`;
    avatar.hidden = false;
    avatarPlaceholder.hidden = true;
}

function validarFoto(arquivo) {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(arquivo.type)) {
        throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
    }
    if (arquivo.size > 5 * 1024 * 1024) {
        throw new Error("A imagem deve ter no máximo 5 MB.");
    }
}

function limitarDeslocamentoFoto() {
    if (!imagemRecorte) return;

    const escalaBase = Math.max(
        canvasRecorteFoto.width / imagemRecorte.naturalWidth,
        canvasRecorteFoto.height / imagemRecorte.naturalHeight
    );
    const largura = imagemRecorte.naturalWidth * escalaBase * zoomFoto;
    const altura = imagemRecorte.naturalHeight * escalaBase * zoomFoto;
    const limiteX = Math.max(0, (largura - canvasRecorteFoto.width) / 2);
    const limiteY = Math.max(0, (altura - canvasRecorteFoto.height) / 2);

    deslocamentoFotoX = Math.max(-limiteX, Math.min(limiteX, deslocamentoFotoX));
    deslocamentoFotoY = Math.max(-limiteY, Math.min(limiteY, deslocamentoFotoY));
}

function abrirModalCartoes(event) {
    acionadorDialogoPerfil = event.currentTarget;
    modalCartoes?.showModal();
    body.classList.add("modal-open");
    modalCartoes?.querySelector(".profile-dialog-close")?.focus();
    atualizarIcones();
}

function desenharRecorteFoto() {
    if (!imagemRecorte) return;

    limitarDeslocamentoFoto();
    const contexto = canvasRecorteFoto.getContext("2d");
    const escalaBase = Math.max(
        canvasRecorteFoto.width / imagemRecorte.naturalWidth,
        canvasRecorteFoto.height / imagemRecorte.naturalHeight
    );
    const escala = escalaBase * zoomFoto;
    const largura = imagemRecorte.naturalWidth * escala;
    const altura = imagemRecorte.naturalHeight * escala;
    const x = (canvasRecorteFoto.width - largura) / 2 + deslocamentoFotoX;
    const y = (canvasRecorteFoto.height - altura) / 2 + deslocamentoFotoY;

    contexto.clearRect(0, 0, canvasRecorteFoto.width, canvasRecorteFoto.height);
    contexto.drawImage(imagemRecorte, x, y, largura, altura);
}

function fecharRecorteFoto() {
    modalRecorteFoto?.close();
    body.classList.remove("modal-open");
    ultimoPontoArraste = null;
    areaRecorteFoto?.classList.remove("dragging");
    if (urlTemporariaFoto) URL.revokeObjectURL(urlTemporariaFoto);
    urlTemporariaFoto = null;
    imagemRecorte = null;
    inputFoto.value = "";
    botaoEditarAvatar?.focus();
}

async function abrirRecorteFoto() {
    const arquivo = inputFoto.files?.[0];
    if (!arquivo || !usuarioAtual) return;

    feedbackFoto.classList.remove("error");
    feedbackFoto.textContent = "";

    try {
        validarFoto(arquivo);
        urlTemporariaFoto = URL.createObjectURL(arquivo);
        imagemRecorte = new Image();
        await new Promise((resolve, reject) => {
            imagemRecorte.onload = resolve;
            imagemRecorte.onerror = () => reject(new Error("Não foi possível abrir esta imagem."));
            imagemRecorte.src = urlTemporariaFoto;
        });

        zoomFoto = 1;
        deslocamentoFotoX = 0;
        deslocamentoFotoY = 0;
        controleZoomFoto.value = "1";
        desenharRecorteFoto();
        modalRecorteFoto.showModal();
        body.classList.add("modal-open");
        botaoSalvarRecorte.focus();
        atualizarIcones();
    } catch (erro) {
        console.error("Não foi possível preparar a foto:", erro);
        feedbackFoto.classList.add("error");
        feedbackFoto.textContent = erro.message || "Não foi possível abrir a foto.";
        if (urlTemporariaFoto) URL.revokeObjectURL(urlTemporariaFoto);
        urlTemporariaFoto = null;
        imagemRecorte = null;
        inputFoto.value = "";
    }
}

function gerarArquivoFotoRecortada() {
    return new Promise((resolve, reject) => {
        canvasRecorteFoto.toBlob(blob => {
            if (!blob) {
                reject(new Error("Não foi possível processar o enquadramento."));
                return;
            }
            resolve(new File([blob], "foto-perfil.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", .9);
    });
}

async function salvarFotoRecortada() {
    if (!imagemRecorte || !usuarioAtual) return;

    botaoSalvarRecorte.disabled = true;
    botaoSalvarRecorte.textContent = "Salvando...";
    feedbackFoto.classList.remove("error");

    try {
        const arquivoRecortado = await gerarArquivoFotoRecortada();
        const imagem = await uploadImagem(arquivoRecortado);
        await atualizarFotoPerfil(usuarioAtual.uid, imagem.url);
        exibirFotoPerfil(imagem.url);
        fecharRecorteFoto();
        feedbackFoto.textContent = "Foto atualizada.";
    } catch (erro) {
        console.error("Não foi possível atualizar a foto:", erro);
        feedbackFoto.classList.add("error");
        feedbackFoto.textContent = erro.message || "Não foi possível atualizar a foto.";
    } finally {
        botaoSalvarRecorte.disabled = false;
        botaoSalvarRecorte.textContent = "Salvar foto";
    }
}

async function carregarPerfil() {
    try {
        const usuarioFirebase = await aguardarUsuario();

        if (!usuarioFirebase) {
            window.location.replace(ROTAS.LOGIN);
            return;
        }

        usuarioAtual = usuarioFirebase;
        const usuarioBanco = await buscarUsuarioPorId(usuarioFirebase.uid);
        exibirDadosUsuario(usuarioFirebase, usuarioBanco);
        botaoEditarAvatar.disabled = false;

        const parametros = new URLSearchParams(window.location.search);
        if (parametros.get("abrir") === "favoritos") {
            parametros.delete("abrir");
            const consulta = parametros.toString();
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${consulta ? `?${consulta}` : ""}${window.location.hash}`
            );
            await abrirModalFavoritos();
        }
    } catch (erro) {
        console.error("Não foi possível carregar o perfil:", erro);
        nome.textContent = "Não foi possível carregar";
        email.textContent = "Tente novamente mais tarde";
    }
}

function fecharModalEndereco() {
    modalEndereco?.close();
    body.classList.remove("modal-open");
    botaoAbrirEnderecos?.focus();
}

function selecionarEndereco(botao, endereco) {
    corpoModalEndereco.querySelectorAll(".address-option-card").forEach(item => {
        item.classList.remove("selecionado");
        item.setAttribute("aria-pressed", "false");
    });
    botao.classList.add("selecionado");
    botao.setAttribute("aria-pressed", "true");
    enderecoSelecionado = {
        id: endereco.id,
        etiqueta: endereco.etiqueta
    };
}

function criarItemEndereco(endereco) {
    const item = document.createElement("li");
    item.className = "address-option-item";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "address-option-card";
    botao.dataset.id = endereco.id;
    botao.setAttribute("aria-pressed", "false");
    botao.setAttribute("aria-label", `Selecionar endereço ${endereco.etiqueta}`);

    const etiqueta = document.createElement("span");
    etiqueta.className = "address-tag";
    etiqueta.textContent = endereco.etiqueta;

    const conteudo = document.createElement("span");
    conteudo.className = "address-option-content";
    const icone = document.createElement("i");
    icone.setAttribute("data-lucide", "map-pin");
    icone.setAttribute("aria-hidden", "true");
    const texto = document.createElement("span");
    texto.className = "address-text";
    const destinatario = document.createElement("span");
    destinatario.className = "address-name";
    destinatario.textContent = endereco.nome;
    const rua = document.createElement("span");
    rua.className = "address-street";
    rua.textContent = `${endereco.rua} Nº ${endereco.numero}`;
    const cep = document.createElement("span");
    cep.className = "address-cep";
    cep.textContent = `CEP: ${endereco.cep} - ${endereco.cidade}, ${endereco.uf}`;
    texto.append(destinatario, rua, cep);
    conteudo.append(icone, texto);
    botao.append(etiqueta, conteudo);
    botao.addEventListener("click", () => selecionarEndereco(botao, endereco));

    const acoes = document.createElement("div");
    acoes.className = "address-option-actions";
    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "btn-edit-address";
    editar.textContent = "Editar";
    editar.setAttribute("aria-label", `Editar endereço ${endereco.etiqueta}`);
    editar.addEventListener("click", () => {
        sessionStorage.setItem("edit-address", endereco.id);
        window.location.href = ROTAS.ENDERECO;
    });
    acoes.append(editar);
    item.append(botao, acoes);
    return { item, botao };
}

function renderizarEnderecos(enderecos) {
    corpoModalEndereco.replaceChildren();

    if (!enderecos.length) {
        corpoModalEndereco.classList.add("modal-body-empty");
        const mensagem = document.createElement("p");
        mensagem.className = "address-empty-message";
        mensagem.textContent = "Cadastre um endereço de entrega";
        corpoModalEndereco.append(mensagem);
        return;
    }

    corpoModalEndereco.classList.remove("modal-body-empty");
    const lista = document.createElement("ul");
    lista.className = "address-list";
    const padrao = obterConfiguracao("enderecoPadrao");

    enderecos.forEach(endereco => {
        const { item, botao } = criarItemEndereco(endereco);
        lista.append(item);
        if (padrao?.id === endereco.id) {
            selecionarEndereco(botao, endereco);
        }
    });
    corpoModalEndereco.append(lista);
    atualizarIcones();
}

async function abrirModalEndereco() {
    if (!usuarioAtual || !modalEndereco) return;
    corpoModalEndereco.setAttribute("aria-busy", "true");
    substituirPorEstado(corpoModalEndereco, "Carregando endereços...");
    modalEndereco.showModal();
    body.classList.add("modal-open");
    botaoFecharModal?.focus();

    try {
        renderizarEnderecos(await listarEnderecos(usuarioAtual.uid));
    } catch (erro) {
        console.error("Não foi possível carregar os endereços:", erro);
        substituirPorEstado(
            corpoModalEndereco,
            "Não foi possível carregar os endereços.",
            "",
            "error"
        );
        mostrarFeedbackGlobal("Não foi possível carregar seus endereços.", "error");
    } finally {
        corpoModalEndereco.setAttribute("aria-busy", "false");
    }
}

async function sairDaConta() {
    botaoSair.disabled = true;
    botaoSair.textContent = "Saindo...";

    try {
        await logout();
        salvarFeedbackNavegacao("Você saiu da sua conta com sucesso.");
        window.location.replace(ROTAS.LOGIN);
    } catch (erro) {
        console.error("Não foi possível sair da conta:", erro);
        mostrarFeedbackGlobal("Não foi possível sair da conta. Tente novamente.", "error");
        botaoSair.disabled = false;
        botaoSair.textContent = "Sair";
    }
}

function atualizarPreviaTamanho(valor) {
    previaFonte.textContent = valor > 105
        ? "Aa+"
        : valor < 95
            ? "Aa-"
            : "Aa";
    controleFonte?.setAttribute(
        "aria-valuetext",
        `${valor}% do tamanho padrão`
    );
    const minimo = Number(controleFonte?.min || 90);
    const maximo = Number(controleFonte?.max || 120);
    const progresso = ((Number(valor) - minimo) / (maximo - minimo)) * 100;
    controleFonte?.style.setProperty("--range-progress", `${progresso}%`);
}

function atualizarAcessibilidade(alteracoes) {
    const configuracoes =
        salvarConfiguracoesAcessibilidade(alteracoes);
    aplicarConfiguracoesAcessibilidade(configuracoes);
}

function iniciarAcessibilidade() {
    const controleFonteDislexia = document.getElementById("dyslexic-font");
    const controleEyeTracking = document.getElementById("eye-tracking");
    const controlesTema = document.querySelectorAll('input[name="theme-mode"]');
    const gatilhoDaltonismo = document.getElementById("color-vision-trigger");
    const textoDaltonismo = document.getElementById("color-vision-current");
    const menuDaltonismo = document.getElementById("color-vision-options");
    const cartaoTema = document.querySelector(".theme-card");
    const opcoesDaltonismo = menuDaltonismo?.querySelectorAll("[data-color-vision]") || [];
    const botaoReset = document.getElementById("reset-accessibility");

    const nomesDaltonismo = {
        protanopia: "Protanopia",
        deuteranopia: "Deuteranopia",
        tritanopia: "Tritanopia",
        protanomalia: "Protanomalia",
        deuteranomalia: "Deuteranomalia",
        tritanomalia: "Tritanomalia",
        acromatopsia: "Acromatopsia"
    };

    const fecharMenuDaltonismo = ({ devolverFoco = false } = {}) => {
        menuDaltonismo.hidden = true;
        gatilhoDaltonismo.setAttribute("aria-expanded", "false");
        botaoReset.hidden = false;
        if (devolverFoco) gatilhoDaltonismo.focus();
    };

    const abrirMenuDaltonismo = ({ moverFoco = true } = {}) => {
        menuDaltonismo.hidden = false;
        gatilhoDaltonismo.setAttribute("aria-expanded", "true");
        botaoReset.hidden = true;
        if (moverFoco) menuDaltonismo.querySelector('[aria-selected="true"]')?.focus();
    };

    const sincronizarControles = (configuracoes) => {
        controleFonte.value = configuracoes.tamanhoTexto;
        controleFonteDislexia.checked = configuracoes.fonteDislexia;
        controleEyeTracking.checked = configuracoes.eyeTracking;
        textoDaltonismo.textContent = nomesDaltonismo[configuracoes.daltonismo] || "Protanopia";
        opcoesDaltonismo.forEach(opcao => {
            opcao.setAttribute("aria-selected", String(opcao.dataset.colorVision === configuracoes.daltonismo));
        });
        controlesTema.forEach(controle => {
            controle.checked = controle.value === configuracoes.tema;
        });
        gatilhoDaltonismo.hidden = configuracoes.tema !== "color-vision";
        cartaoTema?.classList.toggle("theme-card-color-vision", configuracoes.tema === "color-vision");
        fecharMenuDaltonismo();
        atualizarPreviaTamanho(configuracoes.tamanhoTexto);
        aplicarConfiguracoesAcessibilidade(configuracoes);
        atualizarIcones();
    };

    sincronizarControles(obterConfiguracoesAcessibilidade());

    controleFonte?.addEventListener("input", ({ target }) => {
        const tamanhoTexto = Number(target.value);
        atualizarPreviaTamanho(tamanhoTexto);
        atualizarAcessibilidade({ tamanhoTexto });
    });
    controleFonteDislexia?.addEventListener("change", ({ target }) => {
        atualizarAcessibilidade({ fonteDislexia: target.checked });
    });
    controleEyeTracking?.addEventListener("change", ({ target }) => {
        atualizarAcessibilidade({ eyeTracking: target.checked });
    });
    controlesTema.forEach(controle => {
        controle.addEventListener("change", ({ target }) => {
            if (!target.checked) return;
            const selecionouDaltonismo = target.value === "color-vision";
            gatilhoDaltonismo.hidden = !selecionouDaltonismo;
            cartaoTema?.classList.toggle("theme-card-color-vision", selecionouDaltonismo);
            if (selecionouDaltonismo) abrirMenuDaltonismo({ moverFoco: false });
            else fecharMenuDaltonismo();
            atualizarAcessibilidade({
                tema: target.value,
                temaEscuro: target.value === "dark"
            });
        });
    });
    gatilhoDaltonismo?.addEventListener("click", () => {
        const abrir = menuDaltonismo.hidden;
        if (abrir) abrirMenuDaltonismo();
        else fecharMenuDaltonismo();
    });
    opcoesDaltonismo.forEach(opcao => {
        opcao.addEventListener("click", () => {
            const daltonismo = opcao.dataset.colorVision;
            textoDaltonismo.textContent = nomesDaltonismo[daltonismo];
            opcoesDaltonismo.forEach(item => {
                item.setAttribute("aria-selected", String(item === opcao));
            });
            atualizarAcessibilidade({ daltonismo, tema: "color-vision" });
            fecharMenuDaltonismo({ devolverFoco: true });
        });
    });
    menuDaltonismo?.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            fecharMenuDaltonismo({ devolverFoco: true });
            return;
        }

        const teclasNavegacao = ["ArrowDown", "ArrowUp", "Home", "End"];
        if (!teclasNavegacao.includes(event.key)) return;

        event.preventDefault();
        const opcoes = [...opcoesDaltonismo];
        const indiceAtual = Math.max(0, opcoes.indexOf(document.activeElement));
        let proximoIndice = indiceAtual;

        if (event.key === "ArrowDown") proximoIndice = (indiceAtual + 1) % opcoes.length;
        if (event.key === "ArrowUp") proximoIndice = (indiceAtual - 1 + opcoes.length) % opcoes.length;
        if (event.key === "Home") proximoIndice = 0;
        if (event.key === "End") proximoIndice = opcoes.length - 1;

        opcoes[proximoIndice]?.focus();
        opcoes[proximoIndice]?.scrollIntoView({ block: "nearest" });
    });
    document.addEventListener("click", event => {
        const clicouNoTemaDaltonismo = event.target
            .closest?.("label")
            ?.querySelector?.('input[name="theme-mode"][value="color-vision"]');
        if (
            menuDaltonismo.hidden
            || clicouNoTemaDaltonismo
            || gatilhoDaltonismo.contains(event.target)
            || menuDaltonismo.contains(event.target)
        ) return;
        fecharMenuDaltonismo();
    });
    botaoReset?.addEventListener("click", () => {
        const configuracoes = salvarConfiguracoesAcessibilidade({
            tamanhoTexto: 100,
            fonteDislexia: false,
            altoContraste: false,
            temaEscuro: false,
            tema: "light",
            eyeTracking: false,
            daltonismo: "protanopia"
        });
        sincronizarControles(configuracoes);
        mostrarFeedbackGlobal("Configurações de acessibilidade restauradas.");
    });
}

controleZoomFoto?.addEventListener("input", ({ target }) => {
    const novoZoom = Number(target.value);
    const proporcao = novoZoom / zoomFoto;
    deslocamentoFotoX *= proporcao;
    deslocamentoFotoY *= proporcao;
    zoomFoto = novoZoom;
    desenharRecorteFoto();
});

areaRecorteFoto?.addEventListener("pointerdown", event => {
    if (!imagemRecorte) return;
    areaRecorteFoto.setPointerCapture(event.pointerId);
    areaRecorteFoto.classList.add("dragging");
    ultimoPontoArraste = { x: event.clientX, y: event.clientY };
});

areaRecorteFoto?.addEventListener("pointermove", event => {
    if (!ultimoPontoArraste || !imagemRecorte) return;
    const escalaVisual = canvasRecorteFoto.width / areaRecorteFoto.getBoundingClientRect().width;
    deslocamentoFotoX += (event.clientX - ultimoPontoArraste.x) * escalaVisual;
    deslocamentoFotoY += (event.clientY - ultimoPontoArraste.y) * escalaVisual;
    ultimoPontoArraste = { x: event.clientX, y: event.clientY };
    desenharRecorteFoto();
});

function finalizarArrasteFoto(event) {
    if (areaRecorteFoto?.hasPointerCapture(event.pointerId)) {
        areaRecorteFoto.releasePointerCapture(event.pointerId);
    }
    ultimoPontoArraste = null;
    areaRecorteFoto?.classList.remove("dragging");
}

areaRecorteFoto?.addEventListener("pointerup", finalizarArrasteFoto);
areaRecorteFoto?.addEventListener("pointercancel", finalizarArrasteFoto);
areaRecorteFoto?.addEventListener("keydown", event => {
    const movimentos = {
        ArrowLeft: [-10, 0],
        ArrowRight: [10, 0],
        ArrowUp: [0, -10],
        ArrowDown: [0, 10]
    };
    const movimento = movimentos[event.key];
    if (!movimento || !imagemRecorte) return;
    event.preventDefault();
    deslocamentoFotoX += movimento[0];
    deslocamentoFotoY += movimento[1];
    desenharRecorteFoto();
});

botaoSalvarRecorte?.addEventListener("click", salvarFotoRecortada);
botaoCancelarRecorte?.addEventListener("click", fecharRecorteFoto);
botaoFecharRecorte?.addEventListener("click", fecharRecorteFoto);
modalRecorteFoto?.addEventListener("click", ({ target }) => {
    if (target === modalRecorteFoto && !botaoSalvarRecorte.disabled) fecharRecorteFoto();
});
modalRecorteFoto?.addEventListener("cancel", event => {
    event.preventDefault();
    if (!botaoSalvarRecorte.disabled) fecharRecorteFoto();
});

window.addEventListener("scroll", atualizarHeaderNoScroll, { passive: true });
botaoSair?.addEventListener("click", sairDaConta);
botaoFiltro?.addEventListener("click", () => {
    sessionStorage.setItem("open-filter", "true");
    window.location.href = ROTAS.HOME;
});
botaoEditarAvatar?.addEventListener("click", () => inputFoto?.click());
inputFoto?.addEventListener("change", abrirRecorteFoto);
avatar?.addEventListener("error", () => {
    exibirFotoPerfil(null);
    feedbackFoto.classList.add("error");
    feedbackFoto.textContent = "Não foi possível carregar a foto atual.";
});
botaoAbrirEnderecos?.addEventListener("click", abrirModalEndereco);
botaoAbrirCartoes?.addEventListener("click", abrirModalCartoes);
botaoAbrirFavoritos?.addEventListener("click", abrirModalFavoritos);
botaoAbrirPedidos?.addEventListener("click", abrirModalPedidos);
botaoAbrirAvaliacoes?.addEventListener("click", abrirModalAvaliacoes);
document.querySelector('a[aria-label="Ver meus favoritos"]')?.addEventListener("click", event => {
    event.preventDefault();
    abrirModalFavoritos(event);
});
document.querySelectorAll(".profile-dialog").forEach(dialogo => {
    dialogo.querySelector("[data-close-profile-dialog]")?.addEventListener("click", () => fecharDialogoPerfil(dialogo));
    dialogo.addEventListener("click", ({ target }) => {
        if (target === dialogo) fecharDialogoPerfil(dialogo);
    });
    dialogo.addEventListener("cancel", event => {
        event.preventDefault();
        fecharDialogoPerfil(dialogo);
    });
});
botaoFecharModal?.addEventListener("click", fecharModalEndereco);
botaoAdicionarEndereco?.addEventListener("click", () => {
    window.location.href = ROTAS.ENDERECO;
});
botaoConfirmarEndereco?.addEventListener("click", () => {
    if (enderecoSelecionado) {
        salvarConfiguracao("enderecoPadrao", enderecoSelecionado);
    }
    fecharModalEndereco();
});
modalEndereco?.addEventListener("click", ({ target }) => {
    if (target === modalEndereco) fecharModalEndereco();
});
modalEndereco?.addEventListener("cancel", () => {
    body.classList.remove("modal-open");
    botaoAbrirEnderecos?.focus();
});

atualizarIcones();
atualizarHeaderNoScroll();
iniciarAcessibilidade();
configurarPesquisaCabecalho({
    aoPesquisar: (busca) => {
        if (!busca) return;
        sessionStorage.setItem("href-pesquisa", busca);
        window.location.href = ROTAS.HOME;
    }
});
carregarPerfil();
