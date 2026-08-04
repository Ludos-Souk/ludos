import {
    buscarCep
} from "../../services/cepService.js";
import Endereco from "../../models/Endereco.js";
import {
    adicionarEndereco
} from "../../services/usuarioService.js";
import {
    obterUid
} from "../../services/authService.js";

// Inicializa os ícones do Lucide assim que o script é carregado
if (window.lucide) {
    window.lucide.createIcons();
}

let temporizador;
const searchForm = document.querySelector('.search-form');
const inputBusca = document.getElementById('search-input');
const btnMicrofone = document.querySelector('.mic-btn');
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
const header = document.querySelector('.header');

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

    if (btnMicrofone) {
        btnMicrofone.addEventListener('click', function() {
            recognition.start();
        });
    }
}

const btnVoltar = document.querySelector('.btn-back');

if (btnVoltar) {
    btnVoltar.addEventListener('click', () => {
        history.back();
    });
}

const inputs = document.querySelectorAll('.input-wrapper input');

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

if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const busca = inputBusca.value.trim();

        if (busca) {
            sessionStorage.setItem("href-pesquisa", busca);
            window.location.href = "home.html";
        }
    });
}

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

async function preencherEnderecoPeloCep(cep) {
    try {
        const dados = await buscarCep(cep);

        if (inputRua) inputRua.value = dados.logradouro || '';
        if (selectUf) selectUf.value = dados.uf || '';
        if (inputCidade) inputCidade.value = dados.localidade || '';
        if (inputBairro) inputBairro.value = dados.bairro || '';
    } catch (erro) {
        console.error(erro.message);
    }
}

if (inputCep) {
    inputCep.addEventListener("input", () => {
        clearTimeout(temporizador);

        temporizador = setTimeout(() => {
            preencherEnderecoPeloCep(inputCep.value);
        }, 500);
    });
}

if (formulario) {
    formulario.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (botao) {
            botao.textContent = "Adicionando...";
            botao.disabled = true;
        }

        try {
            const uid = obterUid();

            if (!uid) {
                console.log("Usuário não autenticado.");    
            }
            const endereco = new Endereco(
                inputEtiqueta.value,
                inputCep.value,
                selectUf.value,
                inputCidade.value,
                inputBairro.value,
                inputN.value,
                inputComplemento.value,
                inputInfoAdicionais.value,
                inputNome.value,
                inputEmail.value
            );

            await adicionarEndereco(uid, endereco);

            sessionStorage.setItem("href-endereco", 20);

            window.location.href = "home.html";
        } catch (erro) {
            console.error(erro);
            if (botao) {
                botao.textContent = "Adicionar";
                botao.disabled = false;
            }
        }
    });
}

// Comportamento de scroll do Header
window.addEventListener("scroll", () => {
    const toast = document.getElementById("cart-toast");

    if (window.scrollY > 30) {
        header?.classList.add("scrolled");
        toast?.classList.add("compact");
    } else {
        header?.classList.remove("scrolled");
        toast?.classList.remove("compact");
    }
});

carregarEstados();