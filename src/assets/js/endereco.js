import { ROTAS } from "../../config/rotas.js";
// #region Imports
import Endereco from "../../models/Endereco.js";
import {
    buscarCep
} from "../../services/cepService.js";
import {
    adicionarEndereco,
    buscarEnderecoPorId,
    atualizarEndereco
} from "../../services/usuarioService.js";
import {
    obterUid,
    aguardarUsuario
} from "../../services/authService.js";
import { mostrarFeedbackGlobal, salvarFeedbackNavegacao } from "./utils/asyncFeedback.js";
import { configurarPesquisaCabecalho } from "./utils/ui.js";
// #endregion


// #region Variáveis
if (window.lucide) {
    window.lucide.createIcons();
}

// Cabeçalho / busca
const header = document.querySelector('.header');
const inputBusca = document.getElementById('search-input');

// Navegação
const btnVoltar = document.querySelector('.btn-back');

// Inputs com botão de limpar
const inputs = document.querySelectorAll('.input-wrapper input');

// Formulário de endereço
const formulario = document.getElementById('endereco-form');
const botao = formulario ? formulario.querySelector('button[type="submit"]') : null;

const inputEtiqueta = document.getElementById('etiqueta-input');
const inputCep = document.getElementById('cep-input');
const inputRua = document.getElementById('rua-input');
const selectUf = document.getElementById('uf-select');
const inputCidade = document.getElementById('cidade-input');
const inputBairro = document.getElementById('bairro-input');
const inputN = document.getElementById('n-input');
const inputComplemento = document.getElementById('complemento-input');
const inputInfoAdicionais = document.getElementById('infoAdicionais-input');
const inputNome = document.getElementById('nome-input');
const inputEmail = document.getElementById('email-input');

// Estado
let editEndereco = null;
let temporizador;

// #endregion


// #region Métodos

function inicializarIconesLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}


// --- Edição de endereço selecionado ---

function alterarEnderecoSelecionado() {
    editEndereco = sessionStorage.getItem("edit-address");

    if (!editEndereco) {
        return;
    }

    carregarEnderecoParaEdicao(editEndereco);
    sessionStorage.removeItem("edit-address");
}

async function carregarEnderecoParaEdicao(enderecoId) {
    formulario?.setAttribute("aria-busy", "true");
    try {
        const usuario = await aguardarUsuario();

        if (!usuario) {
            throw new Error("Sua sessão expirou. Entre novamente para editar o endereço.");
        }

        const endereco = await buscarEnderecoPorId(obterUid(), enderecoId);
        if (!endereco) throw new Error("O endereço selecionado não foi encontrado.");

        if (botao) botao.textContent = "Alterar";

    if (inputEtiqueta) inputEtiqueta.value = endereco.etiqueta || "";
    if (inputCep) inputCep.value = formatarCep(endereco.cep);
    if (inputRua) inputRua.value = endereco.rua || "";
    if (selectUf) selectUf.value = endereco.uf || "";
    if (inputCidade) inputCidade.value = endereco.cidade || "";
    if (inputBairro) inputBairro.value = endereco.bairro || "";
    if (inputN) inputN.value = endereco.numero || "";
    if (inputComplemento) inputComplemento.value = endereco.complemento || "";
    if (inputInfoAdicionais) inputInfoAdicionais.value = endereco.informacoesAdicionais || "";
    if (inputNome) inputNome.value = endereco.nome || "";
        if (inputEmail) inputEmail.value = endereco.email || "";
    } catch (erro) {
        mostrarFeedbackGlobal(erro.message || "Não foi possível carregar o endereço.", "error");
    } finally {
        formulario?.setAttribute("aria-busy", "false");
    }
}


// --- Cabeçalho (scroll) ---

function inicializarScrollHeader() {
    const atualizarHeader = () => {
        header?.classList.add("sem-banner");
        header?.classList.toggle("scrolled", window.scrollY > 30);
    };

    window.addEventListener("scroll", atualizarHeader, { passive: true });
    atualizarHeader();
}

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


// --- Navegação (voltar) ---

function inicializarBtnVoltar() {
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            let possuiPaginaAnteriorDoProjeto = false;

            if (document.referrer) {
                try {
                    const paginaAnterior = new URL(document.referrer);
                    possuiPaginaAnteriorDoProjeto =
                        paginaAnterior.origin === window.location.origin;
                } catch (erro) {
                    console.warn("Não foi possível identificar a página anterior:", erro);
                }
            }

            if (possuiPaginaAnteriorDoProjeto && window.history.length > 1) {
                window.history.back();
                return;
            }

            window.location.href = ROTAS.HOME;
        });
    }
}


// --- Botões de limpar input ---

function inicializarInputsClear() {
    inputs.forEach(input => {
        const btnClear = input.parentElement.querySelector('.btn-clear-input');

        if (btnClear) {
            input.addEventListener('input', () => {
                if (input.value.length > 0) {
                    btnClear.classList.add('visible');
                } else {
                    btnClear.classList.remove('visible');
                }
            });

            btnClear.addEventListener('click', () => {
                input.value = '';
                btnClear.classList.remove('visible');
                input.focus();
            });
        }
    });
}


// --- Carregar Estados (IBGE) ---

async function carregarEstados() {
    if (!selectUf) return;

    selectUf.disabled = true;
    selectUf.setAttribute("aria-busy", "true");
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        const estados = await response.json();

        estados.sort((a, b) => a.sigla.localeCompare(b.sigla));

        const fragment = document.createDocumentFragment();

        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.sigla;
            option.textContent = estado.sigla;
            fragment.appendChild(option);
        });

        selectUf.appendChild(fragment);

    } catch (erro) {
        console.error("Erro ao buscar os estados no IBGE:", erro);
        const fallbackOptions = [
            { value: 'SP', label: 'SP' },
            { value: 'RJ', label: 'RJ' }
        ];

        fallbackOptions.forEach(({ value, label }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            selectUf.appendChild(option);
        });
        mostrarFeedbackGlobal("Não foi possível carregar todos os estados. Exibimos opções básicas.", "error");
    } finally {
        selectUf.disabled = false;
        selectUf.setAttribute("aria-busy", "false");
    }
}


// --- Preenchimento automático via CEP ---

function formatarCep(valor) {
    const numeros = String(valor ?? "").replace(/\D/g, "").slice(0, 8);
    return numeros.length > 5
        ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
        : numeros;
}

async function preencherEnderecoPeloCep(cep) {
    if (cep.replace(/\D/g, "").length !== 8) return;
    inputCep?.setAttribute("aria-busy", "true");
    try {
        const dados = await buscarCep(cep);

        if (inputRua) inputRua.value = dados.logradouro || "";
        if (selectUf) selectUf.value = dados.uf || "";
        if (inputCidade) inputCidade.value = dados.localidade || "";
        if (inputBairro) inputBairro.value = dados.bairro || "";
        mostrarFeedbackGlobal("Endereço preenchido a partir do CEP.");
    } catch (erro) {
        console.error(erro.message);
        mostrarFeedbackGlobal(erro.message || "Não foi possível localizar este CEP.", "error");
    } finally {
        inputCep?.setAttribute("aria-busy", "false");
    }
}

function inicializarCepAutoPreenchimento() {
    if (!inputCep) return;

    inputCep.addEventListener("input", () => {
        inputCep.value = formatarCep(inputCep.value);
        clearTimeout(temporizador);

        temporizador = setTimeout(() => {
            preencherEnderecoPeloCep(inputCep.value);
        }, 500);
    });
}


// --- Envio do formulário de endereço ---

function inicializarFormularioEndereco() {
    if (!formulario) return;

    formulario.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (inputCep) inputCep.value = formatarCep(inputCep.value);

        if (botao) {
            botao.textContent = editEndereco ? "Alterando..." : "Adicionando...";
            botao.disabled = true;
        }

        try {
            const uid = obterUid();

            if (!uid) {
                throw new Error("Sua sessão expirou. Entre novamente para salvar o endereço.");
            }

            const endereco = new Endereco(
                inputEtiqueta ? inputEtiqueta.value : "",
                inputCep ? inputCep.value : "",
                inputRua ? inputRua.value : "",
                selectUf ? selectUf.value : "",
                inputCidade ? inputCidade.value : "",
                inputBairro ? inputBairro.value : "",
                inputN ? inputN.value : "",
                inputComplemento ? inputComplemento.value : "",
                inputInfoAdicionais ? inputInfoAdicionais.value : "",
                inputNome ? inputNome.value : "",
                inputEmail ? inputEmail.value : ""
            );

            if (editEndereco) {
                await atualizarEndereco(uid, editEndereco, endereco);
            } else {
                await adicionarEndereco(uid, endereco);
            }

            sessionStorage.setItem(
                "href-endereco",
                JSON.stringify({
                    id: endereco.id,
                    etiqueta: endereco.etiqueta
                })
            );

            salvarFeedbackNavegacao(
                editEndereco ? "Endereço atualizado com sucesso." : "Endereço adicionado com sucesso."
            );
            window.location.href = ROTAS.HOME;
        } catch (erro) {
            console.error(erro);
            mostrarFeedbackGlobal(
                erro.message || "Não foi possível salvar o endereço. Revise os dados e tente novamente.",
                "error"
            );
            if (botao) {
                botao.textContent = editEndereco ? "Alterar" : "Adicionar";
                botao.disabled = false;
            }
        }
    });
}

// #endregion


// #region Métodos de inicialização

inicializarIconesLucide();
inicializarScrollHeader();
configurarPesquisaCabecalho({
    input: inputBusca,
    aoPesquisar: (busca) => {
        if (!busca) return;
        sessionStorage.setItem("href-pesquisa", busca);
        window.location.href = ROTAS.HOME;
    }
});
inicializarBtnVoltar();
inicializarInputsClear();
inicializarCepAutoPreenchimento();
inicializarFormularioEndereco();

alterarEnderecoSelecionado();
carregarEstados();

// #endregion
