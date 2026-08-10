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
import {
    aplicarConfiguracoesAcessibilidade,
    obterConfiguracoesAcessibilidade,
    obterConfiguracao,
    salvarConfiguracao,
    salvarConfiguracoesAcessibilidade
} from "../../services/configuracoesService.js";

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
let usuarioAtual = null;
let enderecoSelecionado = null;

function atualizarIcones() {
    window.lucide?.createIcons();
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

async function alterarFotoPerfil() {
    const arquivo = inputFoto.files?.[0];
    if (!arquivo || !usuarioAtual) return;

    botaoEditarAvatar.disabled = true;
    feedbackFoto.classList.remove("error");
    feedbackFoto.textContent = "Enviando foto...";

    try {
        validarFoto(arquivo);
        const imagem = await uploadImagem(arquivo);
        await atualizarFotoPerfil(usuarioAtual.uid, imagem.url);
        exibirFotoPerfil(imagem.url);
        feedbackFoto.textContent = "Foto atualizada.";
    } catch (erro) {
        console.error("Não foi possível atualizar a foto:", erro);
        feedbackFoto.classList.add("error");
        feedbackFoto.textContent = erro.message || "Não foi possível atualizar a foto.";
    } finally {
        botaoEditarAvatar.disabled = false;
        inputFoto.value = "";
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
    corpoModalEndereco.innerHTML = "<p>Carregando endereços...</p>";
    modalEndereco.showModal();
    body.classList.add("modal-open");
    botaoFecharModal?.focus();

    try {
        renderizarEnderecos(await listarEnderecos(usuarioAtual.uid));
    } catch (erro) {
        console.error("Não foi possível carregar os endereços:", erro);
        corpoModalEndereco.innerHTML = "<p>Não foi possível carregar os endereços.</p>";
    }
}

async function sairDaConta() {
    botaoSair.disabled = true;
    botaoSair.textContent = "Saindo...";

    try {
        await logout();
        window.location.replace(ROTAS.LOGIN);
    } catch (erro) {
        console.error("Não foi possível sair da conta:", erro);
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
}

function atualizarAcessibilidade(alteracoes) {
    const configuracoes =
        salvarConfiguracoesAcessibilidade(alteracoes);
    aplicarConfiguracoesAcessibilidade(configuracoes);
}

function iniciarAcessibilidade() {
    const configuracoes = obterConfiguracoesAcessibilidade();
    const controleFonteDislexia = document.getElementById("dyslexic-font");
    const controleContraste = document.getElementById("high-contrast");
    const controleTema = document.getElementById("dark-theme");

    controleFonte.value = configuracoes.tamanhoTexto;
    controleFonteDislexia.checked = configuracoes.fonteDislexia;
    controleContraste.checked = configuracoes.altoContraste;
    controleTema.checked = configuracoes.temaEscuro;
    atualizarPreviaTamanho(configuracoes.tamanhoTexto);
    aplicarConfiguracoesAcessibilidade(configuracoes);

    controleFonte?.addEventListener("input", ({ target }) => {
        const tamanhoTexto = Number(target.value);
        atualizarPreviaTamanho(tamanhoTexto);
        atualizarAcessibilidade({ tamanhoTexto });
    });
    controleFonteDislexia?.addEventListener("change", ({ target }) => {
        atualizarAcessibilidade({ fonteDislexia: target.checked });
    });
    controleContraste?.addEventListener("change", ({ target }) => {
        atualizarAcessibilidade({ altoContraste: target.checked });
    });
    controleTema?.addEventListener("change", ({ target }) => {
        atualizarAcessibilidade({ temaEscuro: target.checked });
    });
}

window.addEventListener("scroll", atualizarHeaderNoScroll, { passive: true });
botaoSair?.addEventListener("click", sairDaConta);
botaoFiltro?.addEventListener("click", () => {
    sessionStorage.setItem("open-filter", "true");
    window.location.href = ROTAS.HOME;
});
botaoEditarAvatar?.addEventListener("click", () => inputFoto?.click());
inputFoto?.addEventListener("change", alterarFotoPerfil);
avatar?.addEventListener("error", () => {
    exibirFotoPerfil(null);
    feedbackFoto.classList.add("error");
    feedbackFoto.textContent = "Não foi possível carregar a foto atual.";
});
botaoAbrirEnderecos?.addEventListener("click", abrirModalEndereco);
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
carregarPerfil();
