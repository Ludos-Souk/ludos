import { recuperarSenha } from "../../services/authService.js";

const formulario = document.getElementById("esqueciSenha-form")
const botao = formulario.querySelector('button[type="submit"]')
var erros = 0

formulario.addEventListener("submit", async function(event) {
    event.preventDefault();
    limparTodosErros();
    botao.disabled = true;
    botao.textContent = "Enviando...";

    var email = document.getElementById("email").value.trim();

    if (email === "") {
        mostrarErro("erro-email", "Preencha o campo de email.", "email")
    }

    if (erros > 0) {
        botao.disabled = false;
        botao.textContent = "Enviar email"
        return;
    }

    try {
        recuperarSenha(email)
        
        window.location.href = "verificarEmail.html"
    } catch (erro) {
        switch (erro.code) {
            case "auth/invalid-email":
                mostrarErro(
                    "erro-email",
                    "Digite um email válido.",
                    "email"
                );
                break;
            case "auth/missing-email":
                mostrarErro(
                    "erro-email",
                    "Informe seu email.",
                    "email"
                );
                break;
            case "auth/user-not-found":
                mostrarErro(
                    "erro-email",
                    "Não encontramos uma conta com esse email.",
                    "email"
                );
                break;
            case "auth/too-many-requests":
                mostrarErro(
                    "erro-email",
                    "Muitas tentativas. Aguarde alguns minutos.",
                    "email"
                );
                break;
            case "auth/network-request-failed":
                mostrarErro(
                    "erro-email",
                    "Sem conexão com a internet.",
                    "email"
                );
                break;
            default:
                mostrarErro(
                    "erro-email",
                    "Não foi possível enviar o email de recuperação.",
                    "email"
                );
        }
        botao.disabled = false;
        botao.textContent = "Enviar email"
    }
})

function mostrarErro(id, mensagem, idInput){
    const erro = document.getElementById(id);
    erro.textContent = mensagem;
    erro.classList.add("show");
    document.getElementById(idInput).parentElement.classList.add("input-group--error");
    erros += 1
}

function limparErro(id, idInput){
    const erro = document.getElementById(id);
    erro.textContent = "";
    erro.classList.remove("show")
    document.getElementById(idInput).parentElement.classList.remove("input-group--error")
}

function limparTodosErros(){
    erros = 0
    limparErro("erro-email", "email")
}