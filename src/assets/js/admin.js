import { ROTAS } from "../../config/rotas.js";
import Produto from "../../models/Produto.js";
import { aguardarUsuario, logout, verificarAdmin } from "../../services/authService.js";
import {
    atualizarProduto,
    cadastrarProduto,
    excluirProduto,
    listarProdutos
} from "../../services/produtoService.js";
import { uploadImagem } from "../../services/cloudinaryService.js";
import Cupom from "../../models/Cupom.js";
import { cadastrarCupom } from "../../services/cupomService.js";
import {
    aplicarConfiguracoesAcessibilidade,
    obterConfiguracoesAcessibilidade,
    salvarConfiguracoesAcessibilidade
} from "../../services/configuracoesService.js";
import { configurarPesquisaCabecalho, debounce } from "./utils/ui.js";

const corpoTabela = document.getElementById("admin-products-body");
const feedback = document.getElementById("admin-feedback");
const textoFeedback = feedback.querySelector("p");
const iconeFeedback = document.getElementById("admin-toast-icon");
const botaoFecharFeedback = document.getElementById("close-admin-toast");
const botaoFiltro = document.getElementById("admin-filter-button");
const popupFiltro = document.getElementById("admin-filter-popup");
const campoBusca = document.getElementById("admin-search-input");
const formularioBusca = document.getElementById("admin-search-form");
const formularioCadastro = document.getElementById("create-product-form");
const formularioEdicao = document.getElementById("edit-product-form");
const formularioExclusao = document.getElementById("delete-product-form");
const formularioCupom = document.getElementById("create-coupon-form");
const dialogoCadastro = document.getElementById("product-dialog");
const dialogoEdicao = document.getElementById("edit-dialog");
const dialogoExclusao = document.getElementById("delete-dialog");
const controleFonteAdmin = document.getElementById("admin-font-size");
const previaFonteAdmin = document.getElementById("admin-font-preview");
const controleDislexiaAdmin = document.getElementById("admin-dyslexic-font");
const controleEyeTrackingAdmin = document.getElementById("admin-eye-tracking");

let produtos = [];
let produtoSelecionado = null;
let urlTemporariaPreview = null;
let temporizadorFeedback = null;
let ordenacaoAtual = "alfabetica";

function atualizarPreviaFonteAdmin(valor) {
    const numero = Number(valor);
    previaFonteAdmin.textContent = numero > 105 ? "Aa+" : numero < 95 ? "Aa-" : "Aa";
    controleFonteAdmin.setAttribute("aria-valuetext", `${numero}% do tamanho padrão`);
    const progresso = ((numero - Number(controleFonteAdmin.min))
        / (Number(controleFonteAdmin.max) - Number(controleFonteAdmin.min))) * 100;
    controleFonteAdmin.style.setProperty("--admin-range-progress", `${progresso}%`);
}

function sincronizarAcessibilidadeAdmin() {
    const configuracoes = obterConfiguracoesAcessibilidade();
    controleFonteAdmin.value = configuracoes.tamanhoTexto;
    controleDislexiaAdmin.checked = Boolean(configuracoes.fonteDislexia);
    controleEyeTrackingAdmin.checked = Boolean(configuracoes.eyeTracking);
    atualizarPreviaFonteAdmin(configuracoes.tamanhoTexto);
}

function atualizarAcessibilidadeAdmin(alteracoes) {
    const configuracoes = salvarConfiguracoesAcessibilidade(alteracoes);
    aplicarConfiguracoesAcessibilidade(configuracoes);
}

function atualizarIcones() {
    window.lucide?.createIcons();
}

function mostrarFeedback(mensagem = "", tipo = "") {
    clearTimeout(temporizadorFeedback);
    textoFeedback.textContent = mensagem;
    feedback.className = `admin-toast ${tipo}`.trim();
    feedback.setAttribute("role", tipo === "error" ? "alert" : "status");
    const icone = document.createElement("i");
    icone.dataset.lucide = tipo === "error" ? "circle-alert" : "circle-check";
    iconeFeedback.replaceChildren(icone);
    feedback.hidden = false;
    atualizarIcones();
    requestAnimationFrame(() => feedback.classList.add("show"));
    temporizadorFeedback = setTimeout(fecharFeedback, 4500);
}

function fecharFeedback() {
    clearTimeout(temporizadorFeedback);
    feedback.classList.remove("show");
    setTimeout(() => { feedback.hidden = true; }, 300);
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(valor) {
    if (!valor) return "—";
    const data = valor?.toDate ? valor.toDate() : new Date(valor);
    return Number.isNaN(data.getTime())
        ? "—"
        : data.toLocaleDateString("pt-BR");
}

function dataParaInput(valor) {
    const data = valor?.toDate ? valor.toDate() : new Date(valor);
    if (!valor || Number.isNaN(data.getTime())) return "";
    return data.toISOString().slice(0, 10);
}

function numeroDoCampo(valor) {
    if (typeof valor === "number") return valor;
    const normalizado = String(valor)
        .replace(/[^\d,.-]/g, "")
        .replace(/\.(?=.*\.)/g, "")
        .replace(",", ".");
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
}

function criarCelula(rotulo, conteudo, classe = "") {
    const celula = document.createElement("td");
    celula.dataset.label = rotulo;
    celula.className = classe;
    if (conteudo instanceof Node) celula.append(conteudo);
    else celula.textContent = conteudo;
    return celula;
}

function criarMiniatura(produto) {
    const moldura = document.createElement("span");
    moldura.className = "product-thumb";

    if (produto.imagem) {
        const imagem = document.createElement("img");
        imagem.src = produto.imagem;
        imagem.alt = `Imagem de ${produto.nome}`;
        imagem.loading = "lazy";
        moldura.append(imagem);
    } else {
        const icone = document.createElement("i");
        icone.dataset.lucide = "image";
        icone.setAttribute("aria-hidden", "true");
        moldura.append(icone);
    }
    return moldura;
}

function criarMenuProduto(produto) {
    const celula = document.createElement("td");
    celula.className = "row-actions";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "row-menu-button";
    botao.dataset.action = "toggle-menu";
    botao.dataset.id = produto.id;
    botao.setAttribute("aria-label", `Abrir ações de ${produto.nome}`);
    botao.setAttribute("aria-expanded", "false");
    const icone = document.createElement("i");
    icone.dataset.lucide = "circle-ellipsis";
    icone.setAttribute("aria-hidden", "true");
    botao.append(icone);

    const menu = document.createElement("menu");
    menu.className = "row-menu";
    menu.hidden = true;
    const opcoes = [
        ["edit", "pencil", "Alterar", ""],
        ["delete", "trash-2", "Excluir", "danger"]
    ];
    opcoes.forEach(([acao, nomeIcone, texto, classe]) => {
        const item = document.createElement("li");
        const opcao = document.createElement("button");
        opcao.type = "button";
        opcao.dataset.action = acao;
        opcao.dataset.id = produto.id;
        opcao.className = classe;
        const iconeOpcao = document.createElement("i");
        iconeOpcao.dataset.lucide = nomeIcone;
        iconeOpcao.setAttribute("aria-hidden", "true");
        opcao.append(iconeOpcao, texto);
        item.append(opcao);
        menu.append(item);
    });
    celula.append(botao, menu);
    return celula;
}

function criarLinhaProduto(produto) {
    const linha = document.createElement("tr");
    linha.dataset.id = produto.id;
    linha.append(
        criarCelula("Imagem", criarMiniatura(produto)),
        criarCelula("Nome", produto.nome || "—"),
        criarCelula("Preço", formatarMoeda(produto.preco)),
        criarCelula("Desconto", `${Number(produto.desconto || 0)}%`),
        criarCelula("Franquia", produto.franquia || "—"),
        criarCelula("Estoque", String(produto.estoque ?? 0)),
        criarCelula("Ativo", produto.ativo ? "Sim" : "Não"),
        criarCelula("Descrição", produto.descricao || "—", "truncate"),
        criarCelula("Criação", formatarData(produto.criadoEm)),
        criarMenuProduto(produto)
    );
    return linha;
}

function renderizarProdutos(lista) {
    corpoTabela.replaceChildren();
    if (!lista.length) {
        const linha = document.createElement("tr");
        const celula = criarCelula("", "Nenhum produto encontrado.", "table-state");
        celula.colSpan = 10;
        linha.append(celula);
        corpoTabela.append(linha);
        return;
    }
    const fragmento = document.createDocumentFragment();
    lista.forEach(produto => fragmento.append(criarLinhaProduto(produto)));
    corpoTabela.append(fragmento);
    atualizarIcones();
}

function renderizarEstadoTabela(mensagem, tipo = "status") {
    corpoTabela.replaceChildren();
    const linha = document.createElement("tr");
    const celula = criarCelula("", mensagem, `table-state${tipo === "error" ? " error" : ""}`);
    celula.colSpan = 10;
    celula.setAttribute("role", tipo === "error" ? "alert" : "status");
    linha.append(celula);
    corpoTabela.append(linha);
}

async function carregarProdutos() {
    corpoTabela.setAttribute("aria-busy", "true");
    renderizarEstadoTabela("Carregando produtos...");
    try {
        produtos = await listarProdutos();
        atualizarListaVisivel();
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        renderizarEstadoTabela("Não foi possível carregar os produtos. Atualize a página e tente novamente.", "error");
        mostrarFeedback("Não foi possível carregar os produtos.", "error");
    } finally {
        corpoTabela.setAttribute("aria-busy", "false");
    }
}

function buscarProduto(id) {
    return produtos.find(produto => produto.id === id) || null;
}

function fecharMenus() {
    document.querySelectorAll(".row-menu").forEach(menu => { menu.hidden = true; });
    document.querySelectorAll(".row-menu-button").forEach(botao => botao.setAttribute("aria-expanded", "false"));
}

function preencherFormularioEdicao(produto) {
    produtoSelecionado = produto;
    document.getElementById("edit-title").textContent = `Alterar ${produto.nome}`;
    formularioEdicao.elements.nome.value = produto.nome || "";
    formularioEdicao.elements.preco.value = String(produto.preco ?? 0).replace(".", ",");
    formularioEdicao.elements.franquia.value = produto.franquia || "";
    formularioEdicao.elements.estoque.value = produto.estoque ?? 0;
    formularioEdicao.elements.desconto.value = produto.desconto ?? 0;
    formularioEdicao.elements.ativo.value = String(Boolean(produto.ativo));
    formularioEdicao.elements.criacao.value = dataParaInput(produto.criadoEm);
    formularioEdicao.elements.descricao.value = produto.descricao || "";
    atualizarPreview(formularioEdicao, produto.imagem);
}

function validarImagem(arquivo) {
    const tipos = ["image/jpeg", "image/png", "image/webp"];
    if (!tipos.includes(arquivo.type)) throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
    if (arquivo.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");
}

async function obterImagem(formulario, imagemAtual = "") {
    const arquivo = formulario.elements.imagem.files?.[0];
    if (!arquivo) return imagemAtual;
    validarImagem(arquivo);
    return (await uploadImagem(arquivo)).url;
}

function criarProdutoDoFormulario(formulario, imagem, criadoEm, id = null) {
    return new Produto(
        id,
        formulario.elements.ativo.value === "true",
        criadoEm,
        formulario.elements.descricao.value.trim(),
        numeroDoCampo(formulario.elements.desconto.value),
        Number.parseInt(formulario.elements.estoque.value, 10),
        formulario.elements.franquia.value.trim(),
        imagem,
        formulario.elements.nome.value.trim(),
        numeroDoCampo(formulario.elements.preco.value)
    );
}

function atualizarPreview(formulario, imagemPadrao = "") {
    const preview = formulario.closest("dialog").querySelector(".product-preview");
    const arquivo = formulario.elements.imagem.files?.[0];
    const moldura = preview.querySelector(".preview-image");
    if (urlTemporariaPreview) URL.revokeObjectURL(urlTemporariaPreview);
    urlTemporariaPreview = arquivo ? URL.createObjectURL(arquivo) : null;
    const url = urlTemporariaPreview || imagemPadrao;
    moldura.replaceChildren();
    if (url) {
        const imagem = document.createElement("img");
        imagem.src = url;
        imagem.alt = "Prévia da imagem do produto";
        moldura.append(imagem);
    } else {
        const icone = document.createElement("i");
        icone.dataset.lucide = "image";
        moldura.append(icone);
    }
    preview.querySelector("small").textContent = formulario.elements.franquia.value || "Franquia";
    preview.querySelector("h4").textContent = formulario.elements.nome.value || "Nome do produto";
    preview.querySelector("strong").textContent = formatarMoeda(numeroDoCampo(formulario.elements.preco.value));
    atualizarIcones();
}

async function cadastrarNovoProduto(evento) {
    evento.preventDefault();
    const botao = formularioCadastro.querySelector('[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Cadastrando...";
    try {
        const imagem = await obterImagem(formularioCadastro);
        const produto = criarProdutoDoFormulario(formularioCadastro, imagem, new Date().toISOString());
        await cadastrarProduto(produto);
        dialogoCadastro.close();
        formularioCadastro.reset();
        mostrarFeedback("Produto cadastrado com sucesso.", "success");
        await carregarProdutos();
    } catch (erro) {
        console.error("Erro ao cadastrar produto:", erro);
        mostrarFeedback(erro.message || "Não foi possível cadastrar o produto.", "error");
    } finally {
        botao.disabled = false;
        botao.textContent = "Cadastrar produto";
    }
}

async function salvarEdicao(evento) {
    evento.preventDefault();
    if (!produtoSelecionado) return;
    const botao = formularioEdicao.querySelector('[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Salvando...";
    try {
        const imagem = await obterImagem(formularioEdicao, produtoSelecionado.imagem);
        const produto = criarProdutoDoFormulario(
            formularioEdicao,
            imagem,
            produtoSelecionado.criadoEm,
            produtoSelecionado.id
        );
        await atualizarProduto(produto.id, produto);
        dialogoEdicao.close();
        mostrarFeedback("Produto alterado com sucesso.", "success");
        await carregarProdutos();
    } catch (erro) {
        console.error("Erro ao alterar produto:", erro);
        mostrarFeedback(erro.message || "Não foi possível alterar o produto.", "error");
    } finally {
        botao.disabled = false;
        botao.textContent = "Salvar alterações";
    }
}

async function confirmarExclusao(evento) {
    evento.preventDefault();
    if (!produtoSelecionado) return;
    const botao = formularioExclusao.querySelector('[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Excluindo...";
    try {
        await excluirProduto(produtoSelecionado.id);
        dialogoExclusao.close();
        mostrarFeedback("Produto excluído com sucesso.", "success");
        await carregarProdutos();
    } catch (erro) {
        console.error("Erro ao excluir produto:", erro);
        mostrarFeedback("Não foi possível excluir o produto.", "error");
    } finally {
        botao.disabled = false;
        botao.textContent = "Excluir";
    }
}

async function cadastrarNovoCupom(evento) {
    evento.preventDefault();
    const botao = formularioCupom.querySelector('[type="submit"]');
    botao.disabled = true;
    botao.textContent = "Cadastrando...";
    try {
        const cupom = new Cupom(
            null,
            formularioCupom.elements.codigo.value,
            Number(formularioCupom.elements.desconto.value),
            formularioCupom.elements.validade.value,
            formularioCupom.elements.ativo.value === "true"
        );
        await cadastrarCupom(cupom);
        formularioCupom.closest("dialog").close();
        formularioCupom.reset();
        mostrarFeedback("Cupom cadastrado com sucesso.", "success");
    } catch (erro) {
        console.error("Erro ao cadastrar cupom:", erro);
        mostrarFeedback(erro.message || "Não foi possível cadastrar o cupom.", "error");
    } finally {
        botao.disabled = false;
        botao.textContent = "Cadastrar cupom";
    }
}

function tratarClique(evento) {
    if (evento.target.closest("#close-admin-toast")) {
        fecharFeedback();
        return;
    }
    if (evento.target.closest("#admin-filter-button")) {
        const abrir = popupFiltro.hidden;
        popupFiltro.hidden = !abrir;
        botaoFiltro.setAttribute("aria-expanded", String(abrir));
        if (abrir) popupFiltro.querySelector("[data-sort]")?.focus();
        return;
    }
    const opcaoOrdenacao = evento.target.closest("[data-sort]");
    if (opcaoOrdenacao) {
        ordenacaoAtual = opcaoOrdenacao.dataset.sort;
        popupFiltro.querySelectorAll("[data-sort]").forEach(opcao => {
            opcao.classList.toggle("selected", opcao === opcaoOrdenacao);
        });
        popupFiltro.hidden = true;
        botaoFiltro.setAttribute("aria-expanded", "false");
        atualizarListaVisivel();
        botaoFiltro.focus();
        return;
    }
    const fechar = evento.target.closest("[data-close-dialog]");
    if (fechar) {
        fechar.closest("dialog")?.close();
        return;
    }
    const abrir = evento.target.closest("[data-open-dialog]");
    if (abrir) {
        if (abrir.dataset.openDialog === "product-dialog") {
            formularioCadastro.reset();
            formularioCadastro.elements.criacao.value = new Date().toISOString().slice(0, 10);
            atualizarPreview(formularioCadastro);
        } else if (abrir.dataset.openDialog === "coupon-dialog") {
            formularioCupom.reset();
            formularioCupom.elements.validade.min = new Date().toISOString().slice(0, 10);
        } else if (abrir.dataset.openDialog === "admin-accessibility-dialog") {
            sincronizarAcessibilidadeAdmin();
        }
        document.getElementById(abrir.dataset.openDialog)?.showModal();
        return;
    }
    const acao = evento.target.closest("[data-action]");
    if (!acao) {
        fecharMenus();
        if (!evento.target.closest("#admin-filter-popup")) {
            popupFiltro.hidden = true;
            botaoFiltro.setAttribute("aria-expanded", "false");
        }
        return;
    }
    const produto = buscarProduto(acao.dataset.id);
    if (acao.dataset.action === "toggle-menu") {
        const menu = acao.nextElementSibling;
        const estavaFechado = menu.hidden;
        fecharMenus();
        menu.hidden = !estavaFechado;
        acao.setAttribute("aria-expanded", String(estavaFechado));
    } else if (acao.dataset.action === "edit" && produto) {
        fecharMenus();
        preencherFormularioEdicao(produto);
        dialogoEdicao.showModal();
    } else if (acao.dataset.action === "delete" && produto) {
        fecharMenus();
        produtoSelecionado = produto;
        document.getElementById("delete-title").textContent = `Excluir ${produto.nome}?`;
        dialogoExclusao.showModal();
    }
}

function produtosFiltrados() {
    const termo = campoBusca.value.trim().toLocaleLowerCase("pt-BR");
    return produtos.filter(produto =>
        (produto.nome || "").toLocaleLowerCase("pt-BR").includes(termo) ||
        (produto.franquia || "").toLocaleLowerCase("pt-BR").includes(termo)
    );
}

function valorData(produto) {
    const data = produto.criadoEm?.toDate
        ? produto.criadoEm.toDate()
        : new Date(produto.criadoEm);
    return Number.isNaN(data.getTime()) ? 0 : data.getTime();
}

function ordenarProdutos(lista) {
    return [...lista].sort((a, b) => {
        if (ordenacaoAtual === "menor-preco") return Number(a.preco) - Number(b.preco);
        if (ordenacaoAtual === "maior-preco") return Number(b.preco) - Number(a.preco);
        if (ordenacaoAtual === "desconto") return Number(b.desconto) - Number(a.desconto);
        if (ordenacaoAtual === "recentes") return valorData(b) - valorData(a);
        return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });
}

function atualizarListaVisivel() {
    renderizarProdutos(ordenarProdutos(produtosFiltrados()));
}

async function autorizarAdministrador() {
    document.body.setAttribute("aria-busy", "true");
    try {
        const usuario = await aguardarUsuario();
        if (!usuario) {
            window.location.replace(ROTAS.LOGIN);
            return false;
        }
        if (!await verificarAdmin()) {
            window.location.replace(ROTAS.HOME);
            return false;
        }
        return true;
    } catch (erro) {
        console.error("Não foi possível validar o acesso administrativo:", erro);
        mostrarFeedback("Não foi possível validar seu acesso. Tente novamente.", "error");
        return false;
    } finally {
        document.body.setAttribute("aria-busy", "false");
    }
}

document.addEventListener("click", tratarClique);
campoBusca.addEventListener("input", debounce(atualizarListaVisivel, 250));
configurarPesquisaCabecalho({
    formulario: formularioBusca,
    input: campoBusca,
    botaoVoz: formularioBusca.querySelector(".mic-btn"),
    aoPesquisar: atualizarListaVisivel
});
formularioCadastro.addEventListener("submit", cadastrarNovoProduto);
formularioEdicao.addEventListener("submit", salvarEdicao);
formularioExclusao.addEventListener("submit", confirmarExclusao);
formularioCupom.addEventListener("submit", cadastrarNovoCupom);
controleFonteAdmin.addEventListener("input", ({ target }) => {
    const tamanhoTexto = Number(target.value);
    atualizarPreviaFonteAdmin(tamanhoTexto);
    atualizarAcessibilidadeAdmin({ tamanhoTexto });
});
controleDislexiaAdmin.addEventListener("change", ({ target }) => {
    atualizarAcessibilidadeAdmin({ fonteDislexia: target.checked });
});
controleEyeTrackingAdmin.addEventListener("change", ({ target }) => {
    atualizarAcessibilidadeAdmin({ eyeTracking: target.checked });
});
[formularioCadastro, formularioEdicao].forEach(formulario => {
    formulario.addEventListener("input", () => atualizarPreview(
        formulario,
        formulario === formularioEdicao ? produtoSelecionado?.imagem : ""
    ));
});
document.querySelector('a[aria-label="Sair da área administrativa"]')?.addEventListener("click", async evento => {
    evento.preventDefault();
    const link = evento.currentTarget;
    link.setAttribute("aria-busy", "true");
    link.setAttribute("aria-disabled", "true");
    try {
        await logout();
        window.location.replace(ROTAS.LOGIN);
    } catch (erro) {
        console.error("Não foi possível sair da área administrativa:", erro);
        mostrarFeedback("Não foi possível sair da conta. Tente novamente.", "error");
        link.removeAttribute("aria-disabled");
        link.setAttribute("aria-busy", "false");
    }
});

sincronizarAcessibilidadeAdmin();
atualizarIcones();
popupFiltro.querySelector('[data-sort="alfabetica"]')?.classList.add("selected");
if (await autorizarAdministrador()) await carregarProdutos();
