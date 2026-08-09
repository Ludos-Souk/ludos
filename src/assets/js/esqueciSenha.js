import { ROTAS } from "../../config/rotas.js";
import { recuperarSenha } from "../../services/authService.js";
import { criarGerenciadorErros, criarControleBotao } from "./utils/formFeedback.js";

const formulario = document.getElementById("esqueciSenha-form");
const botao = formulario.querySelector('button[type="submit"]');

const { mostrarErro, limparTodosErros, temErros } = criarGerenciadorErros([
    ["erro-email", "email"],
]);
const { definirCarregando, restaurar } = criarControleBotao(botao, "Enviar email");

const MENSAGENS_ERRO_RECUPERACAO = {
    "auth/invalid-email": "Digite um email válido.",
    "auth/missing-email": "Informe seu email.",
    "auth/user-not-found": "Não encontramos uma conta com esse email.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
    "auth/network-request-failed": "Sem conexão com a internet.",
};

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();
    limparTodosErros();
    definirCarregando("Enviando...");

    const email = document.getElementById("email").value.trim();

    if (email === "") {
        mostrarErro("erro-email", "Preencha o campo de email.", "email");
    }

    if (temErros()) {
        restaurar();
        return;
    }

    try {
        await recuperarSenha(email);
        window.location.href = ROTAS.VERIFICAR_EMAIL;
    } catch (erro) {
        exibirErroDeRecuperacao(erro);
        restaurar();
    }
});

function exibirErroDeRecuperacao(erro) {
    const mensagem = MENSAGENS_ERRO_RECUPERACAO[erro.code] ?? "Não foi possível enviar o email de recuperação.";
    mostrarErro("erro-email", mensagem, "email");
}
