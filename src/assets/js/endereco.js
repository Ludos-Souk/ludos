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
const botao = formulario.querySelector('button[type="submit"]');

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
    console.log("entrou aqui")
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

    botao.textContent = "Alterar";

    inputEtiqueta.value = endereco.etiqueta;
    inputCep.value = endereco.cep;
    inputRua.value = endereco.rua;
    selectUf.value = endereco.uf;
    inputCidade.value = endereco.cidade;
    inputBairro.value = endereco.bairro;
    inputN.value = endereco.numero;
    inputComplemento.value = endereco.complemento;
    inputInfoAdicionais.value = endereco.informacoesAdicionais;
    inputNome.value = endereco.nome;
    inputEmail.value = endereco.email;
}


// --- Cabeçalho (scroll) ---

function inicializarScrollHeader() {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 30) {
            header?.classList.add("scrolled");
            header?.classList.add("sem-banner");
        } else {
            header?.classList.remove("scrolled");
        }
    });
}


// --- Pesquisa por voz (Speech Recognition) ---

function inicializarPesquisaPorVoz() {
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
}

function inicializarFormularioBusca() {
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const busca = inputBusca.value.trim();

        if (busca) {
            sessionStorage.setItem("href-pesquisa", busca);
            window.location.href = "home.html";
        }
    });
}


// --- Navegação (voltar) ---

function inicializarBtnVoltar() {
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            window.location.href = "home.html";
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


// --- Estados (IBGE) ---

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
        selectUf.innerHTML += '<option value="SP">SP</option><option value="RJ">RJ</option>';
    }
}


// --- Preenchimento automático via CEP ---

async function preencherEnderecoPeloCep(cep) {
    try {
        const dados =
            await buscarCep(cep);

        inputRua.value = dados.logradouro
        selectUf.value = dados.uf
        inputCidade.value = dados.localidade
        inputBairro.value = dados.bairro
    } catch (erro) {
        console.error(
            erro.message
        );
    }
}

function inicializarCepAutoPreenchimento() {
    inputCep.addEventListener("input", () => {

        clearTimeout(temporizador);

        temporizador = setTimeout(() => {
            preencherEnderecoPeloCep(inputCep.value);
        }, 500);
    });
}


// --- Envio do formulário de endereço ---

function inicializarFormularioEndereco() {
    formulario.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (editEndereco) {
            botao.textContent = "Alterando..."
        } else {
            botao.textContent = "Adicionando...";
        }
        botao.disabled = true;

        try {
            const uid = obterUid();

            if (!uid) {
                console.log("Usuário não autenticado.")
            }
            const endereco =
                new Endereco(
                    inputEtiqueta.value,
                    inputCep.value,
                    inputRua.value,
                    selectUf.value,
                    inputCidade.value,
                    inputBairro.value,
                    inputN.value,
                    inputComplemento.value,
                    inputInfoAdicionais.value,
                    inputNome.value,
                    inputEmail.value
                );

            if (editEndereco) {
                await atualizarEndereco(
                    uid,
                    editEndereco,
                    endereco
                );
            } else {
                await adicionarEndereco(
                    uid,
                    endereco
                );
            }

            sessionStorage.setItem(
                "href-endereco",
                JSON.stringify({
                    id: endereco.id,
                    etiqueta: endereco.etiqueta
                })
            )

            if (editEndereco) {
                botao.textContent = "Alterar"
            } else {
                botao.textContent = "Adicionar";
            }
            botao.disabled = false;

            window.location.href = "home.html";
        } catch (erro) {
            console.error(erro);
            if (editEndereco) {
                botao.textContent = "Alterar"
            } else {
                botao.textContent = "Adicionar";
            }
            botao.disabled = false;
        }
    })
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

carregarEstados();
alterarEnderecoSelecionado();

// #endregion