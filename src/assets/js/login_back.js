import { login } from "../../services/authService.js";
import { criarGerenciadorErros, criarControleBotao } from "./utils/formFeedback.js";
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

const formulario = document.getElementById("login-form");
const botao = formulario.querySelector('button[type="submit"]');

const { mostrarErro, limparTodosErros, temErros } = criarGerenciadorErros([
    ["erro-email", "email"],
    ["erro-senha", "senha"],
]);
const { definirCarregando, restaurar } = criarControleBotao(botao, "Entrar");

const MENSAGENS_ERRO_LOGIN = {
    "auth/invalid-credential": "Email ou senha incorretos.",
    "auth/invalid-email": "Digite um email válido.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
};

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();
    limparTodosErros();
    definirCarregando("Entrando...");

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    validarCampos(email, senha);

    if (temErros()) {
        restaurar();
        return;
    }

    try {
        await login(email, senha);
        irParaHome();
    } catch (erro) {
        exibirErroDeLogin(erro);
        restaurar();
    }
});

function validarCampos(email, senha) {
    if (email === "") {
        mostrarErro("erro-email", "Preencha o campo de email.", "email");
    }
    if (senha === "") {
        mostrarErro("erro-senha", "Preencha o campo de senha.", "senha");
    }
}

function exibirErroDeLogin(erro) {
    const mensagem = MENSAGENS_ERRO_LOGIN[erro.code] ?? "Não foi possível realizar o login.";
    mostrarErro("erro-email", mensagem, "email");
}

function irParaHome() {
    window.location.href = "home.html";
}