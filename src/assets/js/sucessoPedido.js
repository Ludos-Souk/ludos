import { ROTAS } from "../../config/rotas.js";
import { configurarPesquisaCabecalho } from "./utils/ui.js";
document.addEventListener('DOMContentLoaded', function () {
    if (window.lucide) {
        window.lucide.createIcons();
    }

    const btnStatus = document.querySelector('.btn-status');
    if (btnStatus) {
        btnStatus.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = ROTAS.PERFIL;
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

    const inputBusca = document.getElementById('search-input');
    configurarPesquisaCabecalho({
        input: inputBusca,
        aoPesquisar: (busca) => {
            if (!busca) return;
            sessionStorage.setItem('href-pesquisa', busca);
            window.location.href = ROTAS.HOME;
        }
    });
});
