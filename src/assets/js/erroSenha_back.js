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

const formulario = document.getElementById("erroSenha-form");
const botao = formulario.querySelector('button[type="submit"]');

formulario.addEventListener("submit", (event) => {
    event.preventDefault();

    window.location.href = "esqueciSenha.html";
})