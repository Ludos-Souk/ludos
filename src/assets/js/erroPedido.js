import { ROTAS } from "../../config/rotas.js";
document.addEventListener('DOMContentLoaded', function () {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    const btnStatus = document.querySelector('.btn-status');
    if (btnStatus) {
        btnStatus.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = ROTAS.CARRINHO;
        });
    }

    const btnCart = document.querySelector('button[aria-label="Ver meu carrinho"]');
    if (btnCart) {
        btnCart.addEventListener('click', function () {
            window.location.href = ROTAS.CARRINHO;
        });
    }

    const btnPerfil = document.querySelector('button[aria-label="Acessar meu perfil"]');
    if (btnPerfil) {
        btnPerfil.addEventListener('click', function () {
            window.location.href = ROTAS.HOME;
        });
    }

    const btnFiltro = document.getElementById('btn-filter');
    if (btnFiltro) {
        btnFiltro.addEventListener('click', function () {
            sessionStorage.setItem('open-filter', 'true');
            window.location.href = ROTAS.HOME;
        });
    }

    const searchForm = document.querySelector('.search-form');
    const inputBusca = document.getElementById('search-input');
    const btnMicrofone = document.querySelector('.mic-btn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const busca = inputBusca?.value.trim();
            if (busca) {
                sessionStorage.setItem('href-pesquisa', busca);
                window.location.href = ROTAS.HOME;
            }
        });
    }

    if (SpeechRecognition && btnMicrofone) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;

        recognition.onstart = function () {
            btnMicrofone.style.color = 'blue';
        };

        recognition.onresult = function (event) {
            const textoFalado = event.results[0][0].transcript;
            if (textoFalado && textoFalado.trim()) {
                sessionStorage.setItem('href-pesquisa', textoFalado.trim());
                window.location.href = ROTAS.HOME;
            }
        };

        recognition.onend = function () {
            btnMicrofone.style.color = '#888';
        };

        recognition.onerror = function (event) {
            console.warn('Erro no reconhecimento de voz:', event.error);
        };

        btnMicrofone.addEventListener('click', function () {
            recognition.start();
        });
    }
});