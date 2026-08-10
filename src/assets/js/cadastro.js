import { ROTAS } from "../../config/rotas.js";
import { cadastro } from "../../services/authService.js";
import { criarGerenciadorErros, criarControleBotao } from "./utils/formFeedback.js";
import { inicializarVisibilidadeSenhas } from "./utils/passwordVisibility.js";
import { mostrarFeedbackGlobal, salvarFeedbackNavegacao } from "./utils/asyncFeedback.js";

inicializarVisibilidadeSenhas();

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
        salvarFeedbackNavegacao("Conta criada com sucesso. Bem-vindo à Ludos!");
        irParaHome();
    } catch (erro) {
        const mensagens = {
            "auth/email-already-in-use": "Este e-mail já está vinculado a uma conta.",
            "auth/invalid-email": "Digite um e-mail válido.",
            "auth/weak-password": "Escolha uma senha mais segura, com pelo menos 6 caracteres."
        };
        const mensagem = mensagens[erro.code] || "Não foi possível criar sua conta. Tente novamente.";
        mostrarErro("erro-email", mensagem, "email");
        mostrarFeedbackGlobal(mensagem, "error");
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
    window.location.href = ROTAS.HOME
}
