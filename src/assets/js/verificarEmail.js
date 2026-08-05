import { 
    verificarLogin 
} from "../../services/authService.js";

async function verificarAcesso() {

    const usuario =
        await verificarLogin();

    if (usuario) {
        window.location.href =
            "home.html";

        return;
    }
}

verificarAcesso();

const formulario = document.getElementById("verificarEmail-form");
const botao = formulario.querySelector('button[type="submit"]');

formulario.addEventListener("submit", function (event) {
    event.preventDefault();
    window.location.href = "mailto:";
});