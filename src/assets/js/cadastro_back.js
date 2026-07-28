import { cadastro } from "../../services/authService.js";
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

const formulario = document.getElementById("cadastro-form");
const botao = formulario.querySelector('button[type="submit"]');

const { mostrarErro, limparTodosErros, temErros } = criarGerenciadorErros([
    ["erro-nome", "nome"],
    ["erro-email", "email"],
    ["erro-senha", "senha"],
]);
const { definirCarregando, restaurar } = criarControleBotao(botao, "Criar conta");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();
    limparTodosErros();
    definirCarregando("Cadastrando...");

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    validarCampos(nome, email, senha);

    if (temErros()) {
        restaurar();
        return;
    }

    try {
        await cadastro(nome, email, senha);
        irParaHome();
    } catch (erro) {
        console.log(erro.message);
        restaurar();
    }
});

function validarCampos(nome, email, senha) {
    if (nome === "") {
        mostrarErro("erro-nome", "Preencha o campo de nome.", "nome");
    }
    if (email === "") {
        mostrarErro("erro-email", "Preencha o campo de email.", "email");
    }
    if (senha === "") {
        mostrarErro("erro-senha", "Preencha o campo de senha.", "senha");
    }
    if (senha?.length < 6) {
        mostrarErro("erro-senha", "A senha deve conter mais que 6 caracteres.", "senha");
    }
}

function irParaHome() {
    window.location.href = "home.html"
}