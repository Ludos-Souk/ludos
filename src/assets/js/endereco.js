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
// #endregion


// #region Variáveis
if (window.lucide) {
    window.lucide.createIcons();
}

// Cabeçalho / busca
const header = document.querySelector('.header');
const searchForm = document.querySelector('.search-form');
const inputBusca = document.getElementById('search-input');
const btnMicrofone = document.querySelector('.mic-btn');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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
    const usuario = await aguardarUsuario();

    if (!usuario) {
        console.log("Usuário não autenticado");
        return;
    }

    const endereco = await buscarEnderecoPorId(
        obterUid(),
        enderecoId,
    );

    if (botao) botao.textContent = "Alterar";

    if (inputEtiqueta) inputEtiqueta.value = endereco.etiqueta || "";
    if (inputCep) inputCep.value = endereco.cep || "";
    if (inputRua) inputRua.value = endereco.rua || "";
    if (selectUf) selectUf.value = endereco.uf || "";
    if (inputCidade) inputCidade.value = endereco.cidade || "";
    if (inputBairro) inputBairro.value = endereco.bairro || "";
    if (inputN) inputN.value = endereco.numero || "";
    if (inputComplemento) inputComplemento.value = endereco.complemento || "";
    if (inputInfoAdicionais) inputInfoAdicionais.value = endereco.informacoesAdicionais || "";
    if (inputNome) inputNome.value = endereco.nome || "";
    if (inputEmail) inputEmail.value = endereco.email || "";
}


// --- Cabeçalho (scroll) ---

function inicializarScrollHeader() {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 30) {
            header?.classList.add("scrolled");
            header?.classList.add("sem-banner");
        } else {
            header?.classList.remove("scrolled");
            header?.classList.remove("sem-banner");
        }
    });
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


// --- Pesquisa por voz (Speech Recognition) ---

function inicializarPesquisaPorVoz() {
    if (!btnMicrofone) return;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;

        recognition.onstart = function() {
            btnMicrofone.style.color = 'blue';
        };

        recognition.onresult = function(event) {
            const textoFalado = event.results[0][0].transcript;
            if (inputBusca) inputBusca.value = textoFalado;
        };

        recognition.onend = function() {
            btnMicrofone.style.color = '#888';
        };

        recognition.onerror = function(event) {
            alert("Erro no reconhecimento: " + event.error);
        };

        btnMicrofone.addEventListener('click', function() {
            recognition.start();
        });

    } else {
        alert("Seu navegador não tem suporte para pesquisa por voz.");
    }
}


// --- Formulário de busca ---

function inicializarFormularioBusca() {
    if (!searchForm) return;

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const busca = inputBusca ? inputBusca.value.trim() : "";

        if (busca) {
            sessionStorage.setItem("href-pesquisa", busca);
            window.location.href = ROTAS.HOME;
        }
    });
}


// --- Navegação (voltar) ---

function inicializarBtnVoltar() {
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
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
    }
}


// --- Preenchimento automático via CEP ---

async function preencherEnderecoPeloCep(cep) {
    try {
        const dados = await buscarCep(cep);

        if (inputRua) inputRua.value = dados.logradouro || "";
        if (selectUf) selectUf.value = dados.uf || "";
        if (inputCidade) inputCidade.value = dados.localidade || "";
        if (inputBairro) inputBairro.value = dados.bairro || "";
    } catch (erro) {
        console.error(erro.message);
    }
}

function inicializarCepAutoPreenchimento() {
    if (!inputCep) return;

    inputCep.addEventListener("input", () => {
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

        if (botao) {
            botao.textContent = editEndereco ? "Alterando..." : "Adicionando...";
            botao.disabled = true;
        }

        try {
            const uid = obterUid();

            if (!uid) {
                console.log("Usuário não autenticado.");
                return;
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

            window.location.href = ROTAS.HOME;
        } catch (erro) {
            console.error(erro);
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
inicializarPesquisaPorVoz();
inicializarBtnVoltar();
inicializarInputsClear();
inicializarFormularioBusca();
inicializarCepAutoPreenchimento();
inicializarFormularioEndereco();

alterarEnderecoSelecionado();
carregarEstados();

// #endregion