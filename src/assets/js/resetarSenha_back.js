import { resetarSenha } from "../../services/authService.js";
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

const formulario = document.getElementById("resetarSenha-form");
const botao = formulario.querySelector('button[type="submit"]');

const { mostrarErro, limparTodosErros, temErros } = criarGerenciadorErros([
    ["erro-senha", "senha"],
    ["erro-senhaConfirma", "senhaConfirma"],
]);
const { definirCarregando, restaurar } = criarControleBotao(botao, "Resetar senha");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();
    limparTodosErros();
    definirCarregando("Resetando...");

    const senha = document.getElementById("senha").value.trim();
    const senhaConfirma = document.getElementById("senhaConfirma").value.trim();

    validarCampos(senha, senhaConfirma);

    if (temErros()) {
        restaurar();
        return;
    }

    try {
        const oobCode = obterOobCode();
        await resetarSenha(oobCode, senha);
        window.location.href = "sucessoSenha.html";
    } catch (erro) {
        window.location.href = "erroSenha.html";
    }
});

function validarCampos(senha, senhaConfirma) {
    if (senha === "") {
        mostrarErro("erro-senha", "Preencha o campo de senha.", "senha");
    }
    if (senhaConfirma === "") {
        mostrarErro("erro-senhaConfirma", "Preencha o campo de confirmar senha.", "senhaConfirma");
    }
    if (senha !== senhaConfirma) {
        mostrarErro("erro-senhaConfirma", "As senhas devem ser iguais.", "senhaConfirma");
        mostrarErro("erro-senha", "", "senha");
    }
}

function obterOobCode() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get("oobCode");
}